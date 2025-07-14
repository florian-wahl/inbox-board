import React, { useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper, IconButton, Collapse } from '@mui/material';
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
                            <Typography variant="subtitle2">From: {order.from}</Typography>
                            {order.subject && <Typography variant="subtitle2">Subject: {order.subject}</Typography>}
                            {order.to && <Typography variant="subtitle2">To: {order.to}</Typography>}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

const Dashboard: React.FC = () => {
    const { subscriptions, orders, unsubscribes, reload } = useInboxData();

    // Trigger data loading when dashboard mounts
    useEffect(() => {
        console.log('Dashboard mounted - checking for parsed data...');
        console.log('Current subscriptions:', subscriptions.length);
        console.log('Current orders:', orders.length);
        console.log('Current unsubscribes:', unsubscribes.length);
    }, [subscriptions.length, orders.length, unsubscribes.length]);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Subscriptions ({subscriptions.length})
                            </Typography>
                            {subscriptions.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {subscriptions.map((subscription) => (
                                        <Box key={subscription.id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {subscription.merchant}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {subscription.plan} - ${subscription.amount}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No subscriptions found
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Orders ({orders.length})
                            </Typography>
                            {orders.length > 0 ? (
                                <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', background: 'transparent' }}>
                                    <Table size="small" aria-label="collapsible table">
                                        <TableBody>
                                            {orders.map((order) => (
                                                <CollapsibleOrderRow key={order.id} order={order} />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No orders found
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Unsubscribe List ({unsubscribes.length})
                        </Typography>
                        {unsubscribes.length > 0 ? (
                            <UnsubscribeList senders={unsubscribes} />
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