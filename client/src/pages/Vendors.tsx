import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ArrowBack,
  Link as LinkIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Vendor {
  _id: string;
  name: string;
  vendorUuid: string;
  completeUrl: string;
  quotaFullUrl: string;
  terminateUrl: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  createdAt: string;
}

const Vendors: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [surveyName, setSurveyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUrlDialog, setOpenUrlDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendorUrl, setSelectedVendorUrl] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    completeUrl: '',
    quotaFullUrl: '',
    terminateUrl: '',
    isActive: true
  });

  const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchVendors();
    fetchSurveyName();
  }, [surveyId]);

  const fetchSurveyName = async () => {
    try {
      const response = await axios.get(`/surveys/${surveyId}`);
      setSurveyName(response.data.data.name);
    } catch (error) {
      console.error('Failed to fetch survey name:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`/surveys/${surveyId}/vendors`);
      setVendors(response.data.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        completeUrl: vendor.completeUrl,
        quotaFullUrl: vendor.quotaFullUrl,
        terminateUrl: vendor.terminateUrl,
        isActive: vendor.isActive
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        completeUrl: '',
        quotaFullUrl: '',
        terminateUrl: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVendor(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingVendor) {
        await axios.put(`/vendors/${editingVendor._id}`, formData);
      } else {
        await axios.post(`/surveys/${surveyId}/vendors`, formData);
      }
      fetchVendors();
      handleCloseDialog();
      showSnackbar(editingVendor ? 'Vendor updated successfully' : 'Vendor created successfully');
    } catch (error) {
      console.error('Failed to save vendor:', error);
      showSnackbar('Failed to save vendor');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`/vendors/${id}`);
        fetchVendors();
        showSnackbar('Vendor deleted successfully');
      } catch (error) {
        console.error('Failed to delete vendor:', error);
        showSnackbar('Failed to delete vendor');
      }
    }
  };

  const handleShowUrl = async (vendor: Vendor) => {
    const entryUrl = `${baseUrl}/v/${vendor.vendorUuid}`;
    setSelectedVendorUrl(entryUrl);
    setOpenUrlDialog(true);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showSnackbar('URL copied to clipboard');
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/surveys/${surveyId}`)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">
            Vendors - {surveyName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Vendor
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Each vendor gets a unique entry URL. Share this URL with the vendor to route their traffic through the redirect system.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Sessions</TableCell>
              <TableCell align="center">Completed</TableCell>
              <TableCell align="center">Conversion</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor._id}>
                <TableCell>{vendor.name}</TableCell>
                <TableCell>
                  <Chip
                    label={vendor.isActive ? 'Active' : 'Inactive'}
                    color={vendor.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{vendor.totalSessions}</TableCell>
                <TableCell align="center">{vendor.completedSessions}</TableCell>
                <TableCell align="center">
                  {vendor.totalSessions > 0
                    ? `${((vendor.completedSessions / vendor.totalSessions) * 100).toFixed(1)}%`
                    : '0%'}
                </TableCell>
                <TableCell>{new Date(vendor.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleShowUrl(vendor)}
                    title="Get Entry URL"
                  >
                    <LinkIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(vendor)}
                    title="Edit Vendor"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(vendor._id)}
                    title="Delete Vendor"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No vendors found. Add vendors to start routing traffic.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Vendor Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Complete URL"
            fullWidth
            variant="outlined"
            placeholder="https://vendor.com/complete"
            helperText="URL to redirect when survey is completed"
            value={formData.completeUrl}
            onChange={(e) => setFormData({ ...formData, completeUrl: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quota Full URL"
            fullWidth
            variant="outlined"
            placeholder="https://vendor.com/quota-full"
            helperText="URL to redirect when quota is full"
            value={formData.quotaFullUrl}
            onChange={(e) => setFormData({ ...formData, quotaFullUrl: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Terminate URL"
            fullWidth
            variant="outlined"
            placeholder="https://vendor.com/terminate"
            helperText="URL to redirect when survey is terminated"
            value={formData.terminateUrl}
            onChange={(e) => setFormData({ ...formData, terminateUrl: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingVendor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* URL Display Dialog */}
      <Dialog open={openUrlDialog} onClose={() => setOpenUrlDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vendor Entry URL</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Share this URL with the vendor to route their traffic through the redirect system:
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}
            >
              {selectedVendorUrl}
            </Typography>
            <IconButton onClick={() => handleCopyUrl(selectedVendorUrl)} sx={{ ml: 2 }}>
              <CopyIcon />
            </IconButton>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            Vendors can append any query parameters to this URL, and they will be passed through to the survey and back to the vendor's return URLs.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUrlDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Vendors;