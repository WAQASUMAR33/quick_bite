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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';

export default function ParkingManagementPage() {
  const { restaurant, token } = useAuth();
  const [parkingSlots, setParkingSlots] = useState([]);
  const [filteredParkingSlots, setFilteredParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    slotNumber: '',
    status: 'AVAILABLE',
  });
  const [error, setError] = useState('');
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Filter states
  const [filterSlotNumber, setFilterSlotNumber] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch parking slots on mount
  useEffect(() => {
    if (!restaurant || !restaurant.id) {
      setError('Please log in as a restaurant to view parking slots');
      setLoading(false);
      return;
    }
    fetchParkingSlots();
  }, [restaurant]);

  // Apply filters
  useEffect(() => {
    const filtered = parkingSlots.filter((slot) => {
      const matchesSlotNumber = filterSlotNumber
        ? slot.slotNumber.toLowerCase().includes(filterSlotNumber.toLowerCase())
        : true;
      const matchesStatus = filterStatus ? slot.status === filterStatus : true;
      return matchesSlotNumber && matchesStatus;
    });
    setFilteredParkingSlots(filtered);
    setPage(0);
  }, [parkingSlots, filterSlotNumber, filterStatus]);

  const fetchParkingSlots = async () => {
    try {
      const response = await fetch(`/api/parking_slots?restaurantId=${restaurant.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch parking slots`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected parking slots data to be an array');
      }
      setParkingSlots(data.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load parking slots: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, slot = null) => {
    setModalMode(mode);
    setSelectedSlot(slot);
    if (mode === 'edit' && slot) {
      setFormData({
        slotNumber: slot.slotNumber,
        status: slot.status,
      });
    } else {
      setFormData({
        slotNumber: '',
        status: 'AVAILABLE',
      });
    }
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { slotNumber, status } = formData;
    if (modalMode !== 'delete') {
      if (!slotNumber) {
        setError('Slot number is required');
        return;
      }
      if (!['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
        setError('Invalid status');
        return;
      }
    }

    try {
      let response;

      if (modalMode === 'add') {
        const payload = {
          restaurantId: restaurant.id,
          slotNumber,
          status,
        };
        response = await fetch('/api/parking_slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedSlot) {
        const payload = {
          restaurantId: restaurant.id,
          slotNumber,
          status,
        };
        response = await fetch(`/api/parking_slots/${selectedSlot.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedSlot) {
        response = await fetch(`/api/parking_slots/${selectedSlot.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchParkingSlots();
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
  const handleFilterSlotNumberChange = (e) => {
    setFilterSlotNumber(e.target.value);
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  if (!restaurant || !restaurant.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in as a restaurant to view parking slots.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Parking Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleModalOpen('add')}
          sx={{ borderRadius: '20px', textTransform: 'none', boxShadow: '0 4px 10px rgba(0, 128, 0, 0.2)' }}
        >
          Add Parking Slot
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Filter by Slot Number"
          value={filterSlotNumber}
          onChange={handleFilterSlotNumberChange}
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
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchParkingSlots}>
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
      ) : filteredParkingSlots.length === 0 ? (
        <Typography>No parking slots found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1b5e20' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Slot Number</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParkingSlots
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((slot) => (
                  <TableRow key={slot.id} sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}>
                    <TableCell>{slot.slotNumber}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor:
                            slot.status === 'AVAILABLE'
                              ? '#e6f4ea'
                              : slot.status === 'OCCUPIED'
                              ? '#fdeded'
                              : '#fff3e0',
                          color:
                            slot.status === 'AVAILABLE'
                              ? '#2e7d32'
                              : slot.status === 'OCCUPIED'
                              ? '#d32f2f'
                              : '#f57c00',
                        }}
                      >
                        {slot.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(slot.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton color="primary" onClick={() => handleModalOpen('edit', slot)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleModalOpen('delete', slot)}>
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
            count={filteredParkingSlots.length}
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
          {modalMode === 'add' ? 'Add Parking Slot' : modalMode === 'edit' ? 'Edit Parking Slot' : 'Delete Parking Slot'}
          <IconButton onClick={handleModalClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {modalMode !== 'delete' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Slot Number"
                name="slotNumber"
                value={formData.slotNumber}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                  required
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
              Are you sure you want to delete parking slot <strong>{selectedSlot?.slotNumber}</strong>?
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