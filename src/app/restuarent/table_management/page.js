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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

export default function TablesPage() {
  const { restaurant, token } = useAuth();
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    status: 'AVAILABLE',
  });
  const [error, setError] = useState('');
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Filter states
  const [filterTableNumber, setFilterTableNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch tables on mount
  useEffect(() => {
    if (!restaurant || !restaurant.id) {
      setError('Please log in as a restaurant to view tables');
      setLoading(false);
      return;
    }
    fetchTables();
  }, [restaurant]);

  // Apply filters whenever tables or filter criteria change
  useEffect(() => {
    const filtered = tables.filter((table) => {
      const matchesTableNumber = table.tableNumber
        .toLowerCase()
        .includes(filterTableNumber.toLowerCase());
      const matchesStatus = filterStatus ? table.status === filterStatus : true;
      return matchesTableNumber && matchesStatus;
    });
    setFilteredTables(filtered);
    setPage(0); // Reset to first page on filter change
  }, [tables, filterTableNumber, filterStatus]);

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/tables?restaurantId=${restaurant.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch tables`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected data to be an array');
      }
      setTables(data.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load tables: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, table = null) => {
    setModalMode(mode);
    setSelectedTable(table);
    if (mode === 'edit' && table) {
      setFormData({
        tableNumber: table.tableNumber,
        capacity: table.capacity.toString(),
        status: table.status,
      });
    } else {
      setFormData({ tableNumber: '', capacity: '', status: 'AVAILABLE' });
    }
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTable(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { tableNumber, capacity, status } = formData;
    if (!tableNumber || !capacity) {
      setError('Table number and capacity are required');
      return;
    }
    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setError('Capacity must be a positive number');
      return;
    }

    try {
      const payload = {
        restaurantId: restaurant.id,
        tableNumber,
        capacity: capacityNum,
        status,
      };
      let response;

      if (modalMode === 'add') {
        response = await fetch('/api/tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedTable) {
        response = await fetch(`/api/tables/${selectedTable.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedTable) {
        response = await fetch(`/api/tables/${selectedTable.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ restaurantId: restaurant.id }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchTables();
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
  const handleFilterTableNumberChange = (e) => {
    setFilterTableNumber(e.target.value);
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  if (!restaurant || !restaurant.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in as a restaurant to view tables.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Table Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleModalOpen('add')}
          sx={{ borderRadius: '20px', textTransform: 'none', boxShadow: '0 4px 10px rgba(0, 128, 0, 0.2)' }}
        >
          Add Table
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Filter by Table Number"
          value={filterTableNumber}
          onChange={handleFilterTableNumberChange}
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
            <MenuItem value="AVAILABLE">Available</MenuItem>
            <MenuItem value="OCCUPIED">Occupied</MenuItem>
            <MenuItem value="RESERVED">Reserved</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={fetchTables}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      ) : filteredTables.length === 0 ? (
        <Typography>No tables found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1B5E20' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Table Number</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Capacity</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTables
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((table) => (
                  <TableRow key={table.id} sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}>
                    <TableCell>{table.tableNumber}</TableCell>
                    <TableCell>{table.capacity}</TableCell>
                    <TableCell>{table.status}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton color="primary" onClick={() => handleModalOpen('edit', table)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleModalOpen('delete', table)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTables.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a3c34', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {modalMode === 'add' ? 'Add Table' : modalMode === 'edit' ? 'Edit Table' : 'Delete Table'}
          <IconButton onClick={handleModalClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {modalMode !== 'delete' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Table Number"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                inputProps={{ min: 1 }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="OCCUPIED">Occupied</MenuItem>
                  <MenuItem value="RESERVED">Reserved</MenuItem>
                </Select>
              </FormControl>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Box>
          ) : (
            <Typography>
              Are you sure you want to delete table <strong>{selectedTable?.tableNumber}</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="inherit">
            Cancel
          </Button>
          {modalMode !== 'delete' ? (
            <Button
              type="submit"
              variant="contained"
              color="success"
              onClick={handleSubmit}
              sx={{ borderRadius: '20px', textTransform: 'none' }}
            >
              {modalMode === 'add' ? 'Add' : 'Update'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmit}
              sx={{ borderRadius: '20px', textTransform: 'none' }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}