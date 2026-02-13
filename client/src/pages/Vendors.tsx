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
  baseRedirectUrl: string;
  completeUrl: string;
  quotaFullUrl: string;
  terminateUrl: string;
  securityTermUrl: string;
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
    baseRedirectUrl: '',
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
        baseRedirectUrl: vendor.baseRedirectUrl,
        isActive: vendor.isActive
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        baseRedirectUrl: '',
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
      // Validate base redirect URL
      if (!formData.baseRedirectUrl.startsWith('http://') && !formData.baseRedirectUrl.startsWith('https://')) {
        showSnackbar('Base Redirect URL must start with http:// or https://');
        return;
      }

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
            label="Base Redirect URL"
            fullWidth
            variant="outlined"
            placeholder="https://survey.trendopinion.com/simpleProcess.php"
            helperText="System will auto-generate 4 URLs: status=1 (Complete), status=2 (Terminate), status=3 (Quota Full), status=4 (Security)"
            value={formData.baseRedirectUrl}
            onChange={(e) => setFormData({ ...formData, baseRedirectUrl: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            The system will automatically create 4 status URLs from your base URL:
            <br/>• Complete: ?status=1&pid={'{{TOID}}'}
            <br/>• Terminate: ?status=2&pid={'{{TOID}}'}
            <br/>• Quota Full: ?status=3&pid={'{{TOID}}'}
            <br/>• Security: ?status=4&pid={'{{TOID}}'}
          </Alert>
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

      {/* URL Display Dialog - Shows Entry URL and All 4 Generated URLs */}
      <Dialog open={openUrlDialog} onClose={() => setOpenUrlDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vendor URLs</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Entry URL (Share with Vendor)
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            This is the URL vendors use to send respondents:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3
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

          <Typography variant="h6" gutterBottom>
            Return URLs (Auto-Generated)
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            These URLs are where respondents will be redirected based on survey completion status:
          </Typography>

          {vendors.find(v => selectedVendorUrl.includes(v.vendorUuid)) && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="success.main">Complete URL (status=1)</Typography>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {vendors.find(v => selectedVendorUrl.includes(v.vendorUuid))?.completeUrl}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="error.main">Terminate URL (status=2)</Typography>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {vendors.find(v => selectedVendorUrl.includes(v.vendorUuid))?.terminateUrl}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="warning.main">Quota Full URL (status=3)</Typography>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {vendors.find(v => selectedVendorUrl.includes(v.vendorUuid))?.quotaFullUrl}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="info.main">Security Term URL (status=4)</Typography>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {vendors.find(v => selectedVendorUrl.includes(v.vendorUuid))?.securityTermUrl}
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            Query parameters from the entry URL will be automatically appended to these return URLs.
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