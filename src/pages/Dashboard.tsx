import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper, IconButton, Collapse, TablePagination } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useInboxData } from '../contexts/InboxDataContext';
import UnsubscribeList from '../components/UnsubscribeList/UnsubscribeList';

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

function CollapsibleUnsubscribeRow({ sender }: { sender: any }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={() => setOpen(!open)}>
                <TableCell sx={{ width: 40, p: 0 }}>
                    <IconButton aria-label="expand row" size="small">
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ border: 0, p: 1 }}>{sender.domain}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={2}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1}>
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

    // Handle pagination change
    const handleOrdersPageChange = (event: unknown, newPage: number) => {
        setOrdersPage(newPage);
    };

    const handleOrdersRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOrdersRowsPerPage(parseInt(event.target.value, 10));
        setOrdersPage(0);
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
                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Subscriptions ({subscriptions.length})
                        </Typography>
                        {subscriptions.length > 0 ? (
                            <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
                                <Table size="small" aria-label="collapsible table">
                                    <TableBody>
                                        {subscriptions.map((subscription) => (
                                            <CollapsibleSubscriptionRow key={subscription.id} subscription={subscription} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No subscriptions found
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Orders ({orders.length})
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

                <Box sx={{ width: '100%', maxWidth: 800 }}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Unsubscribe List ({unsubscribes.length})
                        </Typography>
                        {unsubscribes.length > 0 ? (
                            <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
                                <Table size="small" aria-label="collapsible table">
                                    <TableBody>
                                        {unsubscribes.map((sender) => (
                                            <CollapsibleUnsubscribeRow key={sender.id} sender={sender} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
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