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

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const uploadImageToServer = async (base64Image, token) => {
  try {
    const uploadApiUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API;
    if (!uploadApiUrl) {
      throw new Error('Image upload API URL is not defined');
    }
    const response = await fetch(uploadApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image: base64Image }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Image upload failed: HTTP ${response.status}`);
    }
    const data = JSON.parse(text);
    if (!data.image_url) {
      throw new Error('No image URL returned from server');
    }
    const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
    if (!/^https?:\/\/.+/.test(fullPath)) {
      throw new Error('Invalid image URL returned from server');
    }
    return fullPath;
  } catch (error) {
    throw error;
  }
};

export default function CategoryManagementPage() {
  const { restaurant, token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    imgurl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Filter state
  const [filterName, setFilterName] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    if (!restaurant || !restaurant.id) {
      setError('Please log in as a restaurant to view categories');
      setLoading(false);
      return;
    }
    fetchCategories();
  }, [restaurant]);

  // Apply filters
  useEffect(() => {
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(filterName.toLowerCase())
    );
    setFilteredCategories(filtered);
    setPage(0);
  }, [categories, filterName]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?restaurantId=${restaurant.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch categories`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected data to be an array');
      }
      setCategories(data.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load categories: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, category = null) => {
    setModalMode(mode);
    setSelectedCategory(category);
    if (mode === 'edit' && category) {
      setFormData({
        name: category.name,
        imgurl: category.imgurl || '',
      });
      setImagePreview(category.imgurl || '');
    } else {
      setFormData({ name: '', imgurl: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setImageFile(file);
        const base64 = await convertToBase64(file);
        setImagePreview(base64);
        setFormData({ ...formData, imgurl: '' });
      } catch (error) {
        setError('Failed to process image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name } = formData;
    if (modalMode !== 'delete') {
      if (!name) {
        setError('Category name is required');
        return;
      }
    }

    try {
      let imgurl = formData.imgurl;
      if (imageFile) {
        const base64Image = await convertToBase64(imageFile);
        imgurl = await uploadImageToServer(base64Image, token);
      }

      let response;
      if (modalMode === 'add') {
        const payload = {
          restaurantId: restaurant.id,
          name,
          imgurl: imgurl || '',
        };
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedCategory) {
        const payload = {
          restaurantId: restaurant.id,
          name,
          imgurl: imgurl || selectedCategory.imgurl || '',
        };
        response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedCategory) {
        response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchCategories();
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

  // Filter handler
  const handleFilterNameChange = (e) => {
    setFilterName(e.target.value);
  };

  if (!restaurant || !restaurant.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in as a restaurant to view categories.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Category Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleModalOpen('add')}
          sx={{ borderRadius: '20px', textTransform: 'none', boxShadow: '0 4px 10px rgba(0, 128, 0, 0.2)' }}
        >
          Add Category
        </Button>
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="Filter by Category Name"
          value={filterName}
          onChange={handleFilterNameChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        />
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchCategories}>
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
      ) : filteredCategories.length === 0 ? (
        <Typography>No categories found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1B5E20' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((category) => (
                  <TableRow key={category.id} sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      {category.imgurl ? (
                        <img
                          src={category.imgurl}
                          alt={category.name}
                          style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        'No image'
                      )}
                    </TableCell>
                    <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton color="primary" onClick={() => handleModalOpen('edit', category)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleModalOpen('delete', category)}>
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
            count={filteredCategories.length}
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
          {modalMode === 'add' ? 'Add Category' : modalMode === 'edit' ? 'Edit Category' : 'Delete Category'}
          <IconButton onClick={handleModalClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {modalMode !== 'delete' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                type="file"
                label="Category Image"
                InputLabelProps={{ shrink: true }}
                name="image"
                onChange={handleImageChange}
                fullWidth
                margin="normal"
                inputProps={{ accept: 'image/*' }}
              />
              {(imagePreview || formData.imgurl) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Image Preview:
                  </Typography>
                  <img
                    src={imagePreview || formData.imgurl}
                    alt="Category preview"
                    style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </Box>
              )}
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Box>
          ) : (
            <Typography>
              Are you sure you want to delete category <strong>{selectedCategory?.name}</strong>?
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