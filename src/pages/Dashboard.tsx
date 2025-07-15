import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper, IconButton, Collapse, TablePagination, TableHead, Button, Snackbar, Chip } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useInboxData } from '../contexts/InboxDataContext';
import { useSnackbar } from 'notistack';
// Remove UnsubscribeList import

function CollapsibleOrderRow({ order }: { order: any }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
                <TableCell sx={{ width: 40, p: 0 }}>
                    <IconButton aria-label="expand row" size="small">
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0, p: 1 }}>{new Date(order.date).toLocaleDateString()}</TableCell>
                <TableCell sx={{ border: 0, p: 1 }}>{order.merchant}</TableCell>
                <TableCell sx={{ border: 0, p: 1 }}>{order.amount ? `$${order.amount}` : ''}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <Typography variant="subtitle2">
                                <Typography component="span" fontWeight="bold">From:</Typography> {order.from}
                            </Typography>
                            {order.subject && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Subject:</Typography> {order.subject}
                                </Typography>
                            )}
                            {order.to && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">To:</Typography> {order.to}
                                </Typography>
                            )}
                            <Typography variant="subtitle2">
                                <Typography component="span" fontWeight="bold">Sent:</Typography> {new Date(order.date).toLocaleString()}
                            </Typography>
                            {order.labelIds && order.labelIds.length > 0 && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Labels:</Typography> {order.labelIds.join(', ')}
                                </Typography>
                            )}
                            {order.headers && Array.isArray(order.headers) && (
                                (() => {
                                    const listUnsubHeader = order.headers.find((h: any) => h.name && h.name.toLowerCase() === 'list-unsubscribe');
                                    return (
                                        <Typography variant="subtitle2">
                                            <Typography component="span" fontWeight="bold">List-Unsubscribe:</Typography> {listUnsubHeader ? listUnsubHeader.value : 'None'}
                                        </Typography>
                                    );
                                })()
                            )}
                        </Box>
                        {order.orderMatchKeyword && (
                            <Box margin={1}>
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Order Keyword:</Typography> {order.orderMatchKeyword}
                                </Typography>
                            </Box>
                        )}
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

function CollapsibleSubscriptionRow({ subscription }: { subscription: any }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
                <TableCell sx={{ width: 40, p: 0 }}>
                    <IconButton aria-label="expand row" size="small">
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0, p: 1 }}>{subscription.merchant}</TableCell>
                <TableCell sx={{ border: 0, p: 1 }}>{subscription.amount ? `$${subscription.amount}` : ''}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <Typography variant="subtitle2">
                                <Typography component="span" fontWeight="bold">From:</Typography> {subscription.from}
                            </Typography>
                            {subscription.to && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">To:</Typography> {subscription.to}
                                </Typography>
                            )}
                            {subscription.subject && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Subject:</Typography> {subscription.subject}
                                </Typography>
                            )}
                            {subscription.date && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Sent:</Typography> {new Date(subscription.date).toLocaleString()}
                                </Typography>
                            )}
                            {subscription.labelIds && subscription.labelIds.length > 0 && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Labels:</Typography> {subscription.labelIds.join(', ')}
                                </Typography>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

// Helper to parse List-Unsubscribe header for URIs
function parseListUnsubscribe(headerValue: string): string[] {
    if (!headerValue) return [];
    const matches = Array.from(headerValue.matchAll(/<([^>]+)>/g));
    return matches.map(m => m[1].trim());
}

// Group unsubscribes by sender 'from' only, using the last (most recent) parsed unsubscribe URIs for each sender
// Also count the number of occurrences for each sender
function getGroupedUnsubscribes(unsubscribes: any[]) {
    const groupedMap = new Map();
    const countMap = new Map();
    for (const sender of unsubscribes) {
        // Always overwrite so the last (most recent) is kept
        groupedMap.set(sender.from, sender);
        countMap.set(sender.from, (countMap.get(sender.from) || 0) + 1);
    }
    // Attach parsed URIs and count for convenience
    return Array.from(groupedMap.values())
        .map(sender => ({
            ...sender,
            _parsedUnsubUris: parseListUnsubscribe(sender.listUnsubscribe || ''),
            _occurrenceCount: countMap.get(sender.from) || 1,
        }))
        .sort((a, b) => b._occurrenceCount - a._occurrenceCount);
}

function CollapsibleUnsubscribeRow({ sender }: { sender: any }) {
    const [open, setOpen] = React.useState(false);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const uris = sender._parsedUnsubUris || parseListUnsubscribe(sender.listUnsubscribe || '');

    // Handler for unsubscribe actions
    const handleUnsubscribe = async () => {
        // Prefer HTTP(s) over mailto
        const httpUri = uris.find((uri: string) => uri.startsWith('http://') || uri.startsWith('https://'));
        const mailtoUri = uris.find((uri: string) => uri.startsWith('mailto:'));
        let success = false;
        let error = '';
        // Show processing snackbar immediately and keep its key
        const processingKey = enqueueSnackbar(`Unsubscribing from ${sender.from}...`, { variant: 'info', persist: true });
        try {
            if (httpUri) {
                // Try HTTP GET
                const response = await fetch(httpUri, { method: 'GET' });
                if (response.ok) {
                    success = true;
                } else {
                    error = `HTTP error: ${response.status}`;
                    console.error(error);
                }
            } else if (mailtoUri) {
                // Placeholder for mailto unsubscribe
                // TODO: Implement sending unsubscribe email via Gmail API
                success = true; // Simulate success
            } else {
                error = 'No supported unsubscribe method found.';
            }
        } catch (e: any) {
            error = e.message || 'Unknown error';
        } finally {
            closeSnackbar(processingKey);
            enqueueSnackbar(
                success
                    ? `Unsubscribe request sent for ${sender.from}!`
                    : `Failed to unsubscribe from ${sender.from}: ${error}`,
                { variant: success ? 'success' : 'error' }
            );
        }
    };

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
                <TableCell sx={{ width: 40, p: 0 }}>
                    <IconButton aria-label="expand row" size="small">
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0, p: 1, width: '100%' }}>{sender.from}</TableCell>
                <TableCell sx={{ border: 0, p: 1, whiteSpace: 'nowrap' }}>
                    <Chip
                        label={sender._occurrenceCount}
                        color="default"
                        size="small"
                        sx={{ verticalAlign: 'middle' }}
                    />
                </TableCell>
                <TableCell sx={{ border: 0, p: 1, whiteSpace: 'nowrap' }}>
                    {uris.length > 0 && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={sender.unsubscribeType !== 'http'}
                            onClick={e => { e.stopPropagation(); handleUnsubscribe(); }}
                        >
                            Unsubscribe
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1} sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line', maxWidth: '100%' }}>
                            <Typography variant="subtitle2">
                                <Typography component="span" fontWeight="bold">Sender Domain:</Typography> {sender.domain}
                            </Typography>
                            {sender.from && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">From:</Typography> {sender.from}
                                </Typography>
                            )}
                            {sender.subject && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Subject:</Typography> {sender.subject}
                                </Typography>
                            )}
                            {sender.to && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">To:</Typography> {sender.to}
                                </Typography>
                            )}
                            {sender.date && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Sent:</Typography> {new Date(sender.date).toLocaleString()}
                                </Typography>
                            )}
                            {sender.labelIds && sender.labelIds.length > 0 && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Labels:</Typography> {sender.labelIds.join(', ')}
                                </Typography>
                            )}
                            {sender.listUnsubscribe && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">List-Unsubscribe:</Typography> {sender.listUnsubscribe}
                                </Typography>
                            )}
                            {uris.length > 0 && (
                                <Typography variant="subtitle2">
                                    <Typography component="span" fontWeight="bold">Parsed Unsubscribe URIs:</Typography> {uris.join(', ')}
                                </Typography>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

const Dashboard: React.FC = () => {
    const { subscriptions, orders, unsubscribes, reload } = useInboxData();

    // Pagination state for orders
    const [ordersPage, setOrdersPage] = useState(0);
    const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(20);

    // Pagination state for unsubscribes
    const [unsubPage, setUnsubPage] = useState(0);
    const [unsubRowsPerPage, setUnsubRowsPerPage] = useState(10);

    // Pagination state for subscriptions
    const [subsPage, setSubsPage] = useState(0);
    const [subsRowsPerPage, setSubsRowsPerPage] = useState(10);

    // Sort orders by date (most recent first) and apply pagination
    const sortedAndPaginatedOrders = useMemo(() => {
        const sortedOrders = [...orders].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Most recent first
        });

        const startIndex = ordersPage * ordersRowsPerPage;
        return sortedOrders.slice(startIndex, startIndex + ordersRowsPerPage);
    }, [orders, ordersPage, ordersRowsPerPage]);

    // Grouped unsubscribes and pagination
    const groupedUnsubscribes = useMemo(() => getGroupedUnsubscribes(unsubscribes), [unsubscribes]);
    const paginatedUnsubscribes = useMemo(() => {
        const startIndex = unsubPage * unsubRowsPerPage;
        return groupedUnsubscribes.slice(startIndex, startIndex + unsubRowsPerPage);
    }, [groupedUnsubscribes, unsubPage, unsubRowsPerPage]);

    // Paginated subscriptions
    const paginatedSubscriptions = useMemo(() => {
        const startIndex = subsPage * subsRowsPerPage;
        return subscriptions.slice(startIndex, startIndex + subsRowsPerPage);
    }, [subscriptions, subsPage, subsRowsPerPage]);

    // Handle pagination change for orders
    const handleOrdersPageChange = (event: unknown, newPage: number) => {
        setOrdersPage(newPage);
    };

    const handleOrdersRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOrdersRowsPerPage(parseInt(event.target.value, 10));
        setOrdersPage(0);
    };

    // Handle pagination change for unsubscribes
    const handleUnsubPageChange = (event: unknown, newPage: number) => {
        setUnsubPage(newPage);
    };

    const handleUnsubRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUnsubRowsPerPage(parseInt(event.target.value, 10));
        setUnsubPage(0);
    };

    // Handle pagination change for subscriptions
    const handleSubsPageChange = (event: unknown, newPage: number) => {
        setSubsPage(newPage);
    };

    const handleSubsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSubsRowsPerPage(parseInt(event.target.value, 10));
        setSubsPage(0);
    };

    // Trigger data loading when dashboard mounts
    useEffect(() => {
    }, [subscriptions.length, orders.length, unsubscribes.length]);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {/* Recent Orders card FIRST */}
                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Recent Orders <Chip label={orders.length} size="small" />
                        </Typography>
                        {orders.length > 0 ? (
                            <>
                                <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
                                    <Table size="small" aria-label="collapsible table">
                                        <TableBody>
                                            {sortedAndPaginatedOrders.map((order) => (
                                                <CollapsibleOrderRow key={order.id} order={order} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={orders.length}
                                    page={ordersPage}
                                    onPageChange={handleOrdersPageChange}
                                    rowsPerPage={ordersRowsPerPage}
                                    onRowsPerPageChange={handleOrdersRowsPerPageChange}
                                    rowsPerPageOptions={[10, 20, 50]}
                                    labelRowsPerPage="Rows per page:"
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No orders found
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Subscriptions card SECOND */}
                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Subscriptions <Chip label={subscriptions.length} size="small" />
                        </Typography>
                        {subscriptions.length > 0 ? (
                            <>
                                <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
                                    <Table size="small" aria-label="collapsible table">
                                        <TableBody>
                                            {paginatedSubscriptions.map((subscription) => (
                                                <CollapsibleSubscriptionRow key={subscription.id} subscription={subscription} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={subscriptions.length}
                                    page={subsPage}
                                    onPageChange={handleSubsPageChange}
                                    rowsPerPage={subsRowsPerPage}
                                    onRowsPerPageChange={handleSubsRowsPerPageChange}
                                    rowsPerPageOptions={[10, 20, 50]}
                                    labelRowsPerPage="Rows per page:"
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No subscriptions found
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Unsubscribe List card THIRD */}
                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Unsubscribe List <Chip label={unsubscribes.length} size="small" />
                        </Typography>
                        {unsubscribes.length > 0 ? (
                            <>
                                <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
                                    <Table size="small" aria-label="collapsible table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell />
                                                <TableCell sx={{ width: '100%' }}>Sender</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>Occurrence</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>Unsubscribe</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedUnsubscribes.map((sender) => (
                                                <CollapsibleUnsubscribeRow key={sender.from} sender={sender} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={groupedUnsubscribes.length}
                                    page={unsubPage}
                                    onPageChange={handleUnsubPageChange}
                                    rowsPerPage={unsubRowsPerPage}
                                    onRowsPerPageChange={handleUnsubRowsPerPageChange}
                                    rowsPerPageOptions={[10, 20, 50]}
                                    labelRowsPerPage="Rows per page:"
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                                />
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No high-noise senders found
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard; 