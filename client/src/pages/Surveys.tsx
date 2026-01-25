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
  CircularProgress
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
  description?: string;
  clientUrl: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  createdAt: string;
  vendorCount?: number;
}

const Surveys: React.FC = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientUrl: '',
    isActive: true
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
        isActive: survey.isActive
      });
    } else {
      setEditingSurvey(null);
      setFormData({
        name: '',
        description: '',
        clientUrl: '',
        isActive: true
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
      isActive: true
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingSurvey) {
        await axios.put(`/surveys/${editingSurvey._id}`, formData);
      } else {
        await axios.post('/surveys', formData);
      }
      fetchSurveys();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save survey:', error);
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
              <TableCell>Status</TableCell>
              <TableCell>Client URL</TableCell>
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
                  <Chip
                    label={survey.isActive ? 'Active' : 'Inactive'}
                    color={survey.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{survey.clientUrl}</TableCell>
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
          <TextField
            margin="dense"
            label="Client Survey URL"
            fullWidth
            variant="outlined"
            placeholder="https://client-survey.com/survey"
            value={formData.clientUrl}
            onChange={(e) => setFormData({ ...formData, clientUrl: e.target.value })}
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
            {editingSurvey ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Surveys;