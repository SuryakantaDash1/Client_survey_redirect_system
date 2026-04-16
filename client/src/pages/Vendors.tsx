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
  Snackbar,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ArrowBack,
  Link as LinkIcon,
  RemoveCircleOutline as RemoveIcon
} from '@mui/icons-material';
import axios from 'axios';

interface RedirectUrlEntry {
  statusName: string;
  statusCodes: string[];
  redirectUrl: string;
}

interface Vendor {
  _id: string;
  name: string;
  vendorSlug: string;
  vendorUuid: string;
  entryParameter: string;
  parameterPlaceholder: string;
  redirectUrls: RedirectUrlEntry[];
  // Legacy fields
  baseRedirectUrl?: string;
  completeUrl?: string;
  quotaFullUrl?: string;
  terminateUrl?: string;
  securityTermUrl?: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  createdAt: string;
}

const DEFAULT_REDIRECT_URLS: RedirectUrlEntry[] = [
  { statusName: 'Complete', statusCodes: ['1'], redirectUrl: '' },
  { statusName: 'Terminate', statusCodes: ['2'], redirectUrl: '' },
  { statusName: 'Quota Full', statusCodes: ['3'], redirectUrl: '' },
  { statusName: 'Security', statusCodes: ['4'], redirectUrl: '' },
];

const STATUS_COLORS: Record<string, string> = {
  'complete': '#2e7d32',
  'terminate': '#d32f2f',
  'quota full': '#ed6c02',
  'security': '#0288d1',
};

const getStatusColor = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return '#666';
};

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
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    entryParameter: 'user_id',
    parameterPlaceholder: 'TOID',
    isActive: true
  });
  const [redirectUrls, setRedirectUrls] = useState<RedirectUrlEntry[]>(
    DEFAULT_REDIRECT_URLS.map(d => ({ ...d }))
  );

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
        entryParameter: vendor.entryParameter || 'user_id',
        parameterPlaceholder: vendor.parameterPlaceholder || 'TOID',
        isActive: vendor.isActive
      });
      // Load existing redirectUrls or build from legacy fields
      if (vendor.redirectUrls && vendor.redirectUrls.length > 0) {
        setRedirectUrls(vendor.redirectUrls.map(r => ({
          statusName: r.statusName,
          statusCodes: [...r.statusCodes],
          redirectUrl: r.redirectUrl
        })));
      } else {
        // Backward compatibility: build from legacy fields
        setRedirectUrls([
          { statusName: 'Complete', statusCodes: ['1'], redirectUrl: vendor.completeUrl || '' },
          { statusName: 'Terminate', statusCodes: ['2'], redirectUrl: vendor.terminateUrl || '' },
          { statusName: 'Quota Full', statusCodes: ['3'], redirectUrl: vendor.quotaFullUrl || '' },
          { statusName: 'Security', statusCodes: ['4'], redirectUrl: vendor.securityTermUrl || '' },
        ]);
      }
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        entryParameter: 'user_id',
        parameterPlaceholder: 'TOID',
        isActive: true
      });
      setRedirectUrls(DEFAULT_REDIRECT_URLS.map(d => ({ ...d, statusCodes: [...d.statusCodes] })));
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVendor(null);
  };

  // Redirect URL card handlers
  const handleAddRedirectUrl = () => {
    setRedirectUrls([...redirectUrls, { statusName: '', statusCodes: [''], redirectUrl: '' }]);
  };

  const handleRemoveRedirectUrl = (index: number) => {
    setRedirectUrls(redirectUrls.filter((_, i) => i !== index));
  };

  const handleRedirectUrlChange = (index: number, field: keyof RedirectUrlEntry, value: string | string[]) => {
    const updated = [...redirectUrls];
    if (field === 'statusCodes') {
      updated[index].statusCodes = value as string[];
    } else {
      updated[index][field] = value as string;
    }
    setRedirectUrls(updated);
  };

  const handleSubmit = async () => {
    try {
      // Validate: at least one redirect URL must be provided
      const validRedirects = redirectUrls.filter(r => r.statusName.trim() && r.redirectUrl.trim());
      if (validRedirects.length === 0) {
        showSnackbar('Please add at least one status redirect URL');
        return;
      }

      // Validate redirect URLs start with http
      for (const r of validRedirects) {
        if (!r.redirectUrl.startsWith('http://') && !r.redirectUrl.startsWith('https://')) {
          showSnackbar(`Redirect URL for "${r.statusName}" must start with http:// or https://`);
          return;
        }
      }

      // Validate each entry has at least one status code
      for (const r of validRedirects) {
        const codes = r.statusCodes.filter(c => c.trim());
        if (codes.length === 0) {
          showSnackbar(`Please add at least one status code for "${r.statusName}"`);
          return;
        }
      }

      // Clean up status codes (remove empty entries, trim whitespace)
      const cleanedRedirects = validRedirects.map(r => ({
        statusName: r.statusName.trim(),
        statusCodes: r.statusCodes.map(c => c.trim()).filter(c => c),
        redirectUrl: r.redirectUrl.trim()
      }));

      const payload = {
        ...formData,
        redirectUrls: cleanedRedirects
      };

      if (editingVendor) {
        await axios.put(`/vendors/${editingVendor._id}`, payload);
      } else {
        await axios.post(`/surveys/${surveyId}/vendors`, payload);
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
    try {
      const response = await axios.get(`/vendors/${vendor._id}/url`);
      const entryUrl = response.data.data.entryUrl;
      setSelectedVendorUrl(entryUrl);
      setSelectedVendor(vendor);
      setOpenUrlDialog(true);
    } catch (error) {
      console.error('Failed to fetch vendor URL:', error);
      showSnackbar('Failed to fetch vendor URL');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showSnackbar('URL copied to clipboard');
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Get redirect URLs to display (from new array or legacy fields)
  const getVendorRedirectUrls = (vendor: Vendor): RedirectUrlEntry[] => {
    if (vendor.redirectUrls && vendor.redirectUrls.length > 0) {
      return vendor.redirectUrls;
    }
    // Fallback to legacy fields
    const legacy: RedirectUrlEntry[] = [];
    if (vendor.completeUrl) legacy.push({ statusName: 'Complete', statusCodes: ['1'], redirectUrl: vendor.completeUrl });
    if (vendor.terminateUrl) legacy.push({ statusName: 'Terminate', statusCodes: ['2'], redirectUrl: vendor.terminateUrl });
    if (vendor.quotaFullUrl) legacy.push({ statusName: 'Quota Full', statusCodes: ['3'], redirectUrl: vendor.quotaFullUrl });
    if (vendor.securityTermUrl) legacy.push({ statusName: 'Security', statusCodes: ['4'], redirectUrl: vendor.securityTermUrl });
    return legacy;
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
          <Box display="flex" gap={2} sx={{ mb: 2 }}>
            <TextField
              margin="dense"
              label="Entry Parameter"
              variant="outlined"
              placeholder="user_id"
              helperText="Query parameter name (e.g., user_id, respondent_id, pid)"
              value={formData.entryParameter}
              onChange={(e) => setFormData({ ...formData, entryParameter: e.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Parameter Placeholder"
              variant="outlined"
              placeholder="TOID"
              helperText="Placeholder in URLs (e.g., TOID, RID, UID)"
              value={formData.parameterPlaceholder}
              onChange={(e) => setFormData({ ...formData, parameterPlaceholder: e.target.value })}
              sx={{ flex: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Redirect URLs Section */}
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Status Redirect URLs
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRedirectUrl}
              variant="outlined"
            >
              Add Status
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Add the redirect URLs provided by the vendor for each status. You can add as many statuses as needed.
            Status codes can be numbers (1, 2, 3) or letters (A, B, C) — enter all codes that should map to each URL, separated by commas.
          </Alert>

          {redirectUrls.map((entry, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2, position: 'relative' }}>
              <CardContent sx={{ pb: '16px !important' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: getStatusColor(entry.statusName), fontWeight: 600 }}
                  >
                    Status #{index + 1}
                  </Typography>
                  {redirectUrls.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveRedirectUrl(index)}
                      color="error"
                      title="Remove this status"
                    >
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>
                <Box display="flex" gap={2} sx={{ mb: 1.5 }}>
                  <TextField
                    size="small"
                    label="Status Name"
                    variant="outlined"
                    placeholder="e.g., Complete, Terminate"
                    value={entry.statusName}
                    onChange={(e) => handleRedirectUrlChange(index, 'statusName', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Status Codes (comma-separated)"
                    variant="outlined"
                    placeholder="e.g., 1, complete, A"
                    helperText="All codes that trigger this redirect"
                    value={entry.statusCodes.join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // While typing: keep raw string in a single-element array so the cursor doesn't jump
                      // Split only on commas, trim whitespace, filter empty entries from trailing commas
                      const codes = raw.split(',').map(s => s.trim()).filter((s, i, arr) =>
                        s !== '' || i < arr.length - 1 // allow empty last slot while typing
                      );
                      handleRedirectUrlChange(index, 'statusCodes', codes.length ? codes : ['']);
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <TextField
                  size="small"
                  label="Redirect URL"
                  variant="outlined"
                  fullWidth
                  placeholder={`e.g., https://vendor.com/callback?status=1&${formData.entryParameter}={{${formData.parameterPlaceholder}}}`}
                  helperText={`Use {{${formData.parameterPlaceholder}}} as placeholder for the respondent ID`}
                  value={entry.redirectUrl}
                  onChange={(e) => handleRedirectUrlChange(index, 'redirectUrl', e.target.value)}
                />
              </CardContent>
            </Card>
          ))}

          <Divider sx={{ my: 2 }} />

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
              mb: 2
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

          {selectedVendor && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Share with Vendor:
              </Typography>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                Send this URL with the parameter placeholder:
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedVendorUrl}?{selectedVendor.entryParameter}={'{'}YOUR_ID{'}'}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1.5, mb: 0.5 }}>
                Example:
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedVendorUrl}?{selectedVendor.entryParameter}={selectedVendor.parameterPlaceholder}123
                </Typography>
              </Box>
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            Return URLs (Vendor-Provided)
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
            These URLs are where respondents will be redirected based on survey completion status:
          </Typography>

          {selectedVendor && getVendorRedirectUrls(selectedVendor).map((r, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: getStatusColor(r.statusName) }}
                >
                  {r.statusName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  (codes: {r.statusCodes.join(', ')})
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  mt: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                  {r.redirectUrl}
                </Typography>
                <IconButton size="small" onClick={() => handleCopyUrl(r.redirectUrl)} sx={{ ml: 1 }}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}

          <Alert severity="info" sx={{ mt: 2 }}>
            Query parameters from the entry URL will be automatically passed through. The placeholder
            {selectedVendor ? ` {{${selectedVendor.parameterPlaceholder}}}` : ''} in each URL will be replaced with the actual respondent ID.
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
