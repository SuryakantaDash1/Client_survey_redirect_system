import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as VendorsIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Survey {
  _id: string;
  name: string;
  surveySlug: string;
  description?: string;
  clientUrl: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  createdAt: string;
  vendorCount?: number;
  completePageMessage?: string;
  terminatePageMessage?: string;
  quotaFullPageMessage?: string;
  securityTermPageMessage?: string;
}

const Surveys: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientUrl: '',
    isActive: true,
    completePageMessage: 'Thank you for your participation. The survey has been completed successfully. Your inputs are valuable and will help us improve healthcare insights.',
    terminatePageMessage: 'Thank you for your participation. Based on your responses, you do not meet the criteria for this study, and the survey has been terminated. We will reach out to you for future survey opportunities.',
    quotaFullPageMessage: 'Thank you for your participation. The required quota for this survey has already been completed. We appreciate your time and interest.',
    securityTermPageMessage: 'Thank you for your participation'
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const response = await axios.get('/surveys');
      setSurveys(response.data.data);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (survey?: Survey) => {
    if (survey) {
      setEditingSurvey(survey);
      setFormData({
        name: survey.name,
        description: survey.description || '',
        clientUrl: survey.clientUrl,
        isActive: survey.isActive,
        completePageMessage: survey.completePageMessage || 'Thank you for your participation. The survey has been completed successfully. Your inputs are valuable and will help us improve healthcare insights.',
        terminatePageMessage: survey.terminatePageMessage || 'Thank you for your participation. Based on your responses, you do not meet the criteria for this study, and the survey has been terminated. We will reach out to you for future survey opportunities.',
        quotaFullPageMessage: survey.quotaFullPageMessage || 'Thank you for your participation. The required quota for this survey has already been completed. We appreciate your time and interest.',
        securityTermPageMessage: survey.securityTermPageMessage || 'Thank you for your participation'
      });
    } else {
      setEditingSurvey(null);
      setFormData({
        name: '',
        description: '',
        clientUrl: '',
        isActive: true,
        completePageMessage: 'Thank you for your participation. The survey has been completed successfully. Your inputs are valuable and will help us improve healthcare insights.',
        terminatePageMessage: 'Thank you for your participation. Based on your responses, you do not meet the criteria for this study, and the survey has been terminated. We will reach out to you for future survey opportunities.',
        quotaFullPageMessage: 'Thank you for your participation. The required quota for this survey has already been completed. We appreciate your time and interest.',
        securityTermPageMessage: 'Thank you for your participation'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSurvey(null);
    setFormData({
      name: '',
      description: '',
      clientUrl: '',
      isActive: true,
      completePageMessage: 'Thank you for your participation. The survey has been completed successfully. Your inputs are valuable and will help us improve healthcare insights.',
      terminatePageMessage: 'Thank you for your participation. Based on your responses, you do not meet the criteria for this study, and the survey has been terminated. We will reach out to you for future survey opportunities.',
      quotaFullPageMessage: 'Thank you for your participation. The required quota for this survey has already been completed. We appreciate your time and interest.',
      securityTermPageMessage: 'Thank you for your participation'
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Validate client survey URL only if provided
      if (formData.clientUrl && !formData.clientUrl.startsWith('http://') && !formData.clientUrl.startsWith('https://')) {
        alert('Client Survey URL must start with http:// or https://');
        setSubmitting(false);
        return;
      }

      // For new surveys, clientUrl is optional (can be added later)
      const dataToSend = editingSurvey
        ? formData
        : {
            ...formData,
            clientUrl: formData.clientUrl || 'https://placeholder.com/survey' // Temporary placeholder
          };

      if (editingSurvey) {
        await axios.put(`/surveys/${editingSurvey._id}`, dataToSend);
      } else {
        await axios.post('/surveys', dataToSend);
      }

      handleCloseDialog();
      await fetchSurveys();
    } catch (error) {
      console.error('Failed to save survey:', error);
      alert('Failed to save survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this survey?')) {
      try {
        await axios.delete(`/surveys/${id}`);
        fetchSurveys();
      } catch (error) {
        console.error('Failed to delete survey:', error);
      }
    }
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
        <Typography variant="h4">Surveys</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Survey
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Survey ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Vendors</TableCell>
              <TableCell align="center">Sessions</TableCell>
              <TableCell align="center">Completed</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey._id}>
                <TableCell>{survey.name}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                    {survey.surveySlug || 'Generating...'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={survey.isActive ? 'Active' : 'Inactive'}
                    color={survey.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">{survey.vendorCount || 0}</TableCell>
                <TableCell align="center">{survey.totalSessions}</TableCell>
                <TableCell align="center">{survey.completedSessions}</TableCell>
                <TableCell>{new Date(survey.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/surveys/${survey._id}`)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/surveys/${survey._id}/vendors`)}
                    title="Manage Vendors"
                  >
                    <VendorsIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(survey)}
                    title="Edit Survey"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(survey._id)}
                    title="Delete Survey"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {surveys.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No surveys found. Create your first survey to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Survey Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSurvey ? 'Edit Survey' : 'Create New Survey'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Survey Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          {!editingSurvey && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                After creating the survey:
              </Typography>
              <Typography variant="body2" component="div">
                1. System will auto-generate status page URLs
                <br />2. Share these URLs with the survey owner for review
                <br />3. Once approved, add the survey owner's URL in the Configuration tab
              </Typography>
            </Alert>
          )}

          {editingSurvey && (
            <TextField
              margin="dense"
              label="Client Survey URL (Optional)"
              fullWidth
              variant="outlined"
              placeholder="https://client-survey.com/survey"
              helperText="The survey platform URL where respondents will be sent"
              value={formData.clientUrl}
              onChange={(e) => setFormData({ ...formData, clientUrl: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

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
          <Button onClick={handleCloseDialog} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {editingSurvey ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingSurvey ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Surveys;