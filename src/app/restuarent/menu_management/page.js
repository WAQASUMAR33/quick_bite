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
  Checkbox,
  FormControlLabel,
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

export default function MenuManagementPage() {
  const { restaurant, token } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedDish, setSelectedDish] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    available: true,
    imgurl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailable, setFilterAvailable] = useState('');

  // Fetch dishes and categories on mount
  useEffect(() => {
    if (!restaurant || !restaurant.id) {
      setError('Please log in as a restaurant to view dishes');
      setLoading(false);
      return;
    }
    fetchCategories();
    fetchDishes();
  }, [restaurant]);

  // Apply filters
  useEffect(() => {
    const filtered = dishes.filter((dish) => {
      const matchesName = dish.name.toLowerCase().includes(filterName.toLowerCase());
      const matchesCategory = filterCategory ? dish.categoryId === parseInt(filterCategory) : true;
      const matchesAvailable = filterAvailable !== '' ? dish.available === (filterAvailable === 'true') : true;
      return matchesName && matchesCategory && matchesAvailable;
    });
    setFilteredDishes(filtered);
    setPage(0);
  }, [dishes, filterName, filterCategory, filterAvailable]);

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
        throw new Error('Expected categories data to be an array');
      }
      setCategories(data.data);
    } catch (err) {
      setError(`Failed to load categories: ${err.message}`);
    }
  };

  const fetchDishes = async () => {
    try {
      const response = await fetch(`/api/menus?restaurantId=${restaurant.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch dishes`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected dishes data to be an array');
      }
      setDishes(data.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load dishes: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, dish = null) => {
    setModalMode(mode);
    setSelectedDish(dish);
    if (mode === 'edit' && dish) {
      setFormData({
        categoryId: dish.categoryId.toString(),
        name: dish.name,
        description: dish.description || '',
        price: dish.price.toString(),
        available: dish.available,
        imgurl: dish.imgurl || '',
      });
      setImagePreview(dish.imgurl || '');
    } else {
      setFormData({
        categoryId: categories.length > 0 ? categories[0].id.toString() : '',
        name: '',
        description: '',
        price: '',
        available: true,
        imgurl: '',
      });
      setImagePreview('');
    }
    setImageFile(null);
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDish(null);
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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

    const { categoryId, name, price, description, available } = formData;
    if (modalMode !== 'delete') {
      if (!categoryId || !name || !price) {
        setError('Category, name, and price are required');
        return;
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Price must be a positive number');
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
          categoryId: parseInt(categoryId),
          name,
          description: description || null,
          price: parseFloat(price),
          available,
          imgurl: imgurl || '',
        };
        response = await fetch('/api/menus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedDish) {
        const payload = {
          categoryId: parseInt(categoryId),
          name,
          description: description || null,
          price: parseFloat(price),
          available,
          imgurl: imgurl || selectedDish.imgurl || '',
        };
        response = await fetch(`/api/menus/${selectedDish.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedDish) {
        response = await fetch(`/api/menus/${selectedDish.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchDishes();
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
  const handleFilterNameChange = (e) => {
    setFilterName(e.target.value);
  };

  const handleFilterCategoryChange = (e) => {
    setFilterCategory(e.target.value);
  };

  const handleFilterAvailableChange = (e) => {
    setFilterAvailable(e.target.value);
  };

  if (!restaurant || !restaurant.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in as a restaurant to view dishes.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
          Menu Management
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleModalOpen('add')}
          sx={{ borderRadius: '20px', textTransform: 'none', boxShadow: '0 4px 10px rgba(0, 128, 0, 0.2)' }}
        >
          Add Dish
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Filter by Dish Name"
          value={filterName}
          onChange={handleFilterNameChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={filterCategory}
            onChange={handleFilterCategoryChange}
            label="Filter by Category"
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter by Availability</InputLabel>
          <Select
            value={filterAvailable}
            onChange={handleFilterAvailableChange}
            label="Filter by Availability"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Available</MenuItem>
            <MenuItem value="false">Not Available</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchDishes}>
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
      ) : filteredDishes.length === 0 ? (
        <Typography>No dishes found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '0px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1B5E20' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Price</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Available</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created At</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDishes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((dish) => (
                  <TableRow key={dish.id} sx={{ '&:hover': { bgcolor: '#f0f0f0' } }}>
                    <TableCell>{dish.name}</TableCell>
                    <TableCell>
                      {dish.imgurl ? (
                        <img src={dish.imgurl} alt={dish.name} style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        'No image'
                      )}
                    </TableCell>
                    <TableCell>{dish.category?.name || 'N/A'}</TableCell>
                    <TableCell>${dish.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: dish.available ? '#e6f4ea' : '#fdeded',
                          color: dish.available ? '#2e7d32' : '#d32f2f',
                        }}
                      >
                        {dish.available ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(dish.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton color="primary" onClick={() => handleModalOpen('edit', dish)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleModalOpen('delete', dish)}>
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
            count={filteredDishes.length}
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
          {modalMode === 'add' ? 'Add Dish' : modalMode === 'edit' ? 'Edit Dish' : 'Delete Dish'}
          <IconButton onClick={handleModalClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {modalMode !== 'delete' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Category</InputLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  label="Category"
                  required
                >
                  {categories.length === 0 ? (
                    <MenuItem value="">No categories available</MenuItem>
                  ) : (
                    categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <TextField
                label="Dish Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={4}
              />
              <TextField
                label="Price ($)"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                inputProps={{ min: 0.01, step: 0.01 }}
              />
              <TextField
                type="file"
                label="Dish Image"
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
                    alt="Dish preview"
                    style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </Box>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    color="success"
                  />
                }
                label="Available"
                sx={{ mt: 2 }}
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Box>
          ) : (
            <Typography>
              Are you sure you want to delete dish <strong>{selectedDish?.name}</strong>?
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