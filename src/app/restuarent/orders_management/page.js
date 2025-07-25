'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Visibility as EyeIcon, Close as CloseIcon } from '@mui/icons-material';

export default function OrderManagementPage() {
  const { restaurant, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    status: 'PENDING',
  });
  const [error, setError] = useState('');
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Filter states
  const [filterOrderId, setFilterOrderId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrderType, setFilterOrderType] = useState('');

  // Fetch orders on mount
  useEffect(() => {
    if (!restaurant || !restaurant.id) {
      setError('Please log in as a restaurant to view orders');
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [restaurant]);

  // Apply filters
  useEffect(() => {
    const filtered = orders.filter((order) => {
      const matchesOrderId = filterOrderId ? String(order.id).includes(filterOrderId) : true;
      const matchesStatus = filterStatus ? order.status === filterStatus : true;
      const matchesOrderType = filterOrderType ? order.order_type === filterOrderType : true;
      return matchesOrderId && matchesStatus && matchesOrderType;
    });
    setFilteredOrders(filtered);
    setPage(0);
  }, [orders, filterOrderId, filterStatus, filterOrderType]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/order_management/${restaurant.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch orders`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected orders data to be an array');
      }
      setOrders(data.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load orders: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (order) => {
    setSelectedOrder(order);
    setFormData({
      status: order.status,
    });
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { status } = formData;
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      setError('Invalid status');
      return;
    }

    try {
      const response = await fetch(`/api/order_management/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchOrders();
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter handlers
  const handleFilterOrderIdChange = (e) => {
    setFilterOrderId(e.target.value);
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleFilterOrderTypeChange = (e) => {
    setFilterOrderType(e.target.value);
  };

  if (!restaurant || !restaurant.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in as a restaurant to view orders.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Order Management
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Filter by Order ID"
          value={filterOrderId}
          onChange={handleFilterOrderIdChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={handleFilterStatusChange}
            label="Filter by Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter by Order Type</InputLabel>
          <Select
            value={filterOrderType}
            onChange={handleFilterOrderTypeChange}
            label="Filter by Order Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Dine In">Dine In</MenuItem>
            <MenuItem value="Take Away">Take Away</MenuItem>
            <MenuItem value="Delivery">Delivery</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchOrders}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Typography>No orders found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1b5e20' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow key={order.id} sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.user?.email || 'N/A'}</TableCell>
                    <TableCell>{order.order_type}</TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor:
                            order.status === 'PENDING'
                              ? '#fff3e0'
                              : order.status === 'CONFIRMED'
                              ? '#e6f4ea'
                              : order.status === 'CANCELLED'
                              ? '#fdeded'
                              : '#e3f2fd',
                          color:
                            order.status === 'PENDING'
                              ? '#f57c00'
                              : order.status === 'CONFIRMED'
                              ? '#2e7d32'
                              : order.status === 'CANCELLED'
                              ? '#d32f2f'
                              : '#1976d2',
                        }}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton color="primary" onClick={() => handleModalOpen(order)} title="View Details">
                        <EyeIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Modal */}
      {modalOpen && selectedOrder && (
        <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1a3c34', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Order #{selectedOrder.id} Details
            <IconButton onClick={handleModalClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Status
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Status"
                    required
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Total Amount
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  ${selectedOrder.totalAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Order Type
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.order_type || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Table No
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.table_no || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  User Email
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.user?.email || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Restaurant
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.restaurant?.name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Date
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.order_date || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Time
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.order_time || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Contact Info
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.contact_info || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Transaction ID
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.trnx_id || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / 2', sm: '1 / 3' } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Transaction Receipt
                </Typography>
                <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                  {selectedOrder.trnx_receipt ? (
                    <a
                      href={selectedOrder.trnx_receipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'underline' }}
                    >
                      View Receipt
                    </a>
                  ) : (
                    'N/A'
                  )}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / 2', sm: '1 / 3' } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Order Items
                </Typography>
                {selectedOrder.orderItems.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedOrder.orderItems.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          bgcolor: '#f5f5f5',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          gap: 2,
                        }}
                      >
                        {item.dish.imgurl && (
                          <img
                            src={item.dish.imgurl}
                            alt={item.dish.name}
                            style={{ height: '48px', width: '48px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {item.dish.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Quantity: {item.quantity} | Unit Price: ${item.unit_rate.toFixed(2)} | Total: ${item.price.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                    No items
                  </Typography>
                )}
              </Box>
              {error && (
                <Box sx={{ gridColumn: { xs: '1 / 2', sm: '1 / 3' }, mt: 2 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose} color="inherit">
              Close
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              onClick={handleSubmit}
              sx={{ borderRadius: '20px', textTransform: 'none' }}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}