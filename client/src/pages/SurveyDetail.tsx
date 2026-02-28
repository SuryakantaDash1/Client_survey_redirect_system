import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  People,
  ContentCopy as CopyIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

interface SurveyDetails {
  _id: string;
  name: string;
  surveySlug: string;
  description?: string;
  clientUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completePageMessage: string;
  terminatePageMessage: string;
  quotaFullPageMessage: string;
  securityTermPageMessage: string;
}

interface StatusUrls {
  complete: string;
  terminate: string;
  quotaFull: string;
  security: string;
  exitCallback: string;
}

interface SurveyStats {
  totalVendors: number;
  activeVendors: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  quotaFullSessions: number;
  terminatedSessions: number;
  avgSessionDuration: number;
}

const SurveyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyDetails | null>(null);
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [statusUrls, setStatusUrls] = useState<StatusUrls | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    color: string;
  }>({
    open: false,
    title: '',
    message: '',
    color: ''
  });
  const [editingConfig, setEditingConfig] = useState(false);
  const [configData, setConfigData] = useState({
    clientUrl: '',
    isActive: true
  });
  const [editMessageDialog, setEditMessageDialog] = useState<{
    open: boolean;
    type: 'complete' | 'terminate' | 'quotaFull' | 'security';
    message: string;
  }>({
    open: false,
    type: 'complete',
    message: ''
  });

  useEffect(() => {
    fetchSurveyDetails();
  }, [id]);

  const fetchSurveyDetails = async () => {
    try {
      const [surveyRes, statsRes, vendorsRes, urlsRes] = await Promise.all([
        axios.get(`/surveys/${id}`),
        axios.get(`/surveys/${id}/stats`),
        axios.get(`/surveys/${id}/vendors`),
        axios.get(`/surveys/${id}/status-urls`)
      ]);
      const surveyData = surveyRes.data.data;
      setSurvey(surveyData);
      setStats(statsRes.data.data);
      setVendors(vendorsRes.data.data || []);
      setStatusUrls(urlsRes.data.data);
      setConfigData({
        clientUrl: surveyData.clientUrl,
        isActive: surveyData.isActive
      });
    } catch (error) {
      console.error('Failed to fetch survey details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const handlePreview = (type: 'complete' | 'terminate' | 'quotaFull' | 'security') => {
    const previewConfig = {
      complete: {
        title: 'Survey Complete',
        message: survey!.completePageMessage,
        color: '#2e7d32'
      },
      terminate: {
        title: 'Survey Terminated',
        message: survey!.terminatePageMessage,
        color: '#c62828'
      },
      quotaFull: {
        title: 'Quota Full',
        message: survey!.quotaFullPageMessage,
        color: '#e65100'
      },
      security: {
        title: 'Security Termination',
        message: survey!.securityTermPageMessage,
        color: '#6a1b9a'
      }
    };

    setPreviewDialog({
      open: true,
      ...previewConfig[type]
    });
  };

  const handleClosePreview = () => {
    setPreviewDialog({
      open: false,
      title: '',
      message: '',
      color: ''
    });
  };

  const handleOpenEditMessage = (type: 'complete' | 'terminate' | 'quotaFull' | 'security') => {
    const messageMap = {
      complete: survey!.completePageMessage,
      terminate: survey!.terminatePageMessage,
      quotaFull: survey!.quotaFullPageMessage,
      security: survey!.securityTermPageMessage
    };
    setEditMessageDialog({
      open: true,
      type,
      message: messageMap[type]
    });
  };

  const handleCloseEditMessage = () => {
    setEditMessageDialog({
      open: false,
      type: 'complete',
      message: ''
    });
  };

  const handleUpdateMessage = async () => {
    try {
      const fieldMap = {
        complete: 'completePageMessage',
        terminate: 'terminatePageMessage',
        quotaFull: 'quotaFullPageMessage',
        security: 'securityTermPageMessage'
      };

      await axios.put(`/surveys/${id}`, {
        [fieldMap[editMessageDialog.type]]: editMessageDialog.message
      });

      await fetchSurveyDetails();
      handleCloseEditMessage();
    } catch (error) {
      console.error('Failed to update message:', error);
      alert('Failed to update message');
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await axios.put(`/surveys/${id}`, configData);
      await fetchSurveyDetails();
      setEditingConfig(false);
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert('Failed to update configuration. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!survey || !stats) {
    return (
      <Box>
        <Typography>Survey not found</Typography>
      </Box>
    );
  }

  const sessionStatusData = [
    { name: 'Completed', value: stats.completedSessions, color: '#4caf50' },
    { name: 'Quota Full', value: stats.quotaFullSessions, color: '#ff9800' },
    { name: 'Terminated', value: stats.terminatedSessions, color: '#f44336' },
    { name: 'Active', value: stats.activeSessions, color: '#2196f3' }
  ];

  // Build vendor performance data from fetched vendors
  const vendorPerformanceData = vendors.map(vendor => ({
    vendor: vendor.name,
    completed: vendor.completedSessions || 0,
    quotaFull: vendor.quotaFullSessions || 0,
    terminated: vendor.terminatedSessions || 0
  }));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/surveys')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">{survey.name}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<People />}
          onClick={() => navigate(`/surveys/${id}/vendors`)}
        >
          Manage Vendors
        </Button>
      </Box>

      {survey.description && (
        <Typography variant="body1" color="textSecondary" mb={2}>
          {survey.description}
        </Typography>
      )}

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Statistics" />
        <Tab label="Status Page URLs" />
        <Tab label="Thank You Pages" />
        <Tab label="Configuration" />
      </Tabs>

      {/* Overview Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Vendors
                </Typography>
                <Typography variant="h3">{stats.totalVendors}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats.activeVendors} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sessions
                </Typography>
                <Typography variant="h3">{stats.totalSessions}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats.activeSessions} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="h3">
                  {stats.totalSessions > 0
                    ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
                    : 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stats.completedSessions} completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Duration
                </Typography>
                <Typography variant="h3">
                  {(stats.avgSessionDuration / 60000).toFixed(1)}m
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  per session
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Session Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sessionStatusData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionStatusData.filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Vendor Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendor" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#4caf50" />
                  <Bar dataKey="quotaFull" fill="#ff9800" />
                  <Bar dataKey="terminated" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Statistics Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Session Breakdown
                  </Typography>
                  <Box mt={2}>
                    <Typography>Total Sessions: {stats.totalSessions}</Typography>
                    <Typography>Active Sessions: {stats.activeSessions}</Typography>
                    <Typography>Completed: {stats.completedSessions}</Typography>
                    <Typography>Quota Full: {stats.quotaFullSessions}</Typography>
                    <Typography>Terminated: {stats.terminatedSessions}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Performance Metrics
                  </Typography>
                  <Box mt={2}>
                    <Typography>
                      Completion Rate: {stats.totalSessions > 0
                        ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(2)
                        : 0}%
                    </Typography>
                    <Typography>
                      Avg Session Duration: {(stats.avgSessionDuration / 60000).toFixed(2)} minutes
                    </Typography>
                    <Typography>
                      Active Vendors: {stats.activeVendors} of {stats.totalVendors}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Status Page URLs Tab */}
      {tabValue === 2 && statusUrls && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Survey ID
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: '#667eea' }}>
                  {survey.surveySlug}
                </Typography>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopyUrl(survey.surveySlug)}
                >
                  Copy
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#e8f5e9' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  Complete Page URL
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 1
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, wordBreak: 'break-all' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {statusUrls.complete}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyUrl(statusUrls.complete)}
                    sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handlePreview('complete')}
                    sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#ffebee' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#c62828', fontWeight: 'bold' }}>
                  Terminate Page URL
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 2
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, wordBreak: 'break-all' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {statusUrls.terminate}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyUrl(statusUrls.terminate)}
                    sx={{ color: '#c62828', borderColor: '#c62828' }}
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handlePreview('terminate')}
                    sx={{ color: '#c62828', borderColor: '#c62828' }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#fff3e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 'bold' }}>
                  Quota Full Page URL
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 3
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, wordBreak: 'break-all' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {statusUrls.quotaFull}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyUrl(statusUrls.quotaFull)}
                    sx={{ color: '#e65100', borderColor: '#e65100' }}
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handlePreview('quotaFull')}
                    sx={{ color: '#e65100', borderColor: '#e65100' }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#f3e5f5' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                  Security Page URL
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 4
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, wordBreak: 'break-all' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {statusUrls.security}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyUrl(statusUrls.security)}
                    sx={{ color: '#6a1b9a', borderColor: '#6a1b9a' }}
                  >
                    Copy URL
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handlePreview('security')}
                    sx={{ color: '#6a1b9a', borderColor: '#6a1b9a' }}
                  >
                    Preview
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  Exit Callback URL
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Share this URL with the survey platform
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, wordBreak: 'break-all' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {statusUrls.exitCallback}?status=&#123;STATUS&#125;
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyUrl(statusUrls.exitCallback + '?status={STATUS}')}
                    sx={{ color: '#1976d2', borderColor: '#1976d2' }}
                  >
                    Copy URL
                  </Button>
                </Box>
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Usage Instructions:
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Complete: status=1 or status=complete
                    <br />• Terminate: status=2 or status=terminate
                    <br />• Quota Full: status=3 or status=quotafull
                    <br />• Security: status=4 or status=security
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Thank You Pages Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: '#e8f5e9',
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  Complete Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 1
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.completePageMessage}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditMessage('complete');
                    }}
                    sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview('complete');
                    }}
                    sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
                  >
                    Preview Page
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: '#ffebee',
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#c62828', fontWeight: 'bold' }}>
                  Terminate Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 2
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.terminatePageMessage}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditMessage('terminate');
                    }}
                    sx={{ color: '#c62828', borderColor: '#c62828' }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview('terminate');
                    }}
                    sx={{ color: '#c62828', borderColor: '#c62828' }}
                  >
                    Preview Page
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: '#fff3e0',
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 'bold' }}>
                  Quota Full Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 3
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.quotaFullPageMessage}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditMessage('quotaFull');
                    }}
                    sx={{ color: '#e65100', borderColor: '#e65100' }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview('quotaFull');
                    }}
                    sx={{ color: '#e65100', borderColor: '#e65100' }}
                  >
                    Preview Page
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: '#f3e5f5',
                height: '100%'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                  Security Term Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 4
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.securityTermPageMessage}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditMessage('security');
                    }}
                    sx={{ color: '#6a1b9a', borderColor: '#6a1b9a' }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview('security');
                    }}
                    sx={{ color: '#6a1b9a', borderColor: '#6a1b9a' }}
                  >
                    Preview Page
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Configuration Tab */}
      {tabValue === 4 && statusUrls && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Survey Configuration
                </Typography>
                {!editingConfig && (
                  <Button
                    variant="outlined"
                    onClick={() => setEditingConfig(true)}
                  >
                    Edit Configuration
                  </Button>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Client Survey URL *
                  </Typography>
                  {editingConfig ? (
                    <TextField
                      fullWidth
                      value={configData.clientUrl}
                      onChange={(e) => setConfigData({ ...configData, clientUrl: e.target.value })}
                      placeholder="https://surveyplatform.com/client-survey/?user_id="
                      helperText="The survey platform URL where respondents will be sent (must end with parameter like ?user_id=)"
                    />
                  ) : (
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace' }}>
                      {survey.clientUrl}
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Exit Callback URL (Share this with client)
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, mb: 2 }}>
                    <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {statusUrls.exitCallback}?status={'{'}STATUS{'}'}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleCopyUrl(statusUrls.exitCallback + '?status={STATUS}')}
                  >
                    Copy Exit Callback URL
                  </Button>
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Instructions for Client:
                    </Typography>
                    <Typography variant="body2" component="div">
                      Configure your survey to redirect to this URL when respondents finish:
                      <br />• Complete: {statusUrls.exitCallback}?status=1
                      <br />• Terminate: {statusUrls.exitCallback}?status=2
                      <br />• Quota Full: {statusUrls.exitCallback}?status=3
                      <br />• Security: {statusUrls.exitCallback}?status=4
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Status
                  </Typography>
                  {editingConfig ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={configData.isActive}
                          onChange={(e) => setConfigData({ ...configData, isActive: e.target.checked })}
                        />
                      }
                      label={configData.isActive ? 'Active' : 'Inactive'}
                    />
                  ) : (
                    <Typography variant="body1">
                      {survey.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(survey.createdAt).toLocaleString()}
                  </Typography>
                </Grid>

                {editingConfig && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditingConfig(false);
                          setConfigData({
                            clientUrl: survey.clientUrl,
                            isActive: survey.isActive
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleUpdateConfig}
                      >
                        Save Configuration
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: previewDialog.color, color: 'white' }}>
          {previewDialog.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box
            sx={{
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 4
            }}
          >
            <Typography variant="h6" sx={{ whiteSpace: 'pre-wrap' }}>
              {previewDialog.message}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog
        open={editMessageDialog.open}
        onClose={handleCloseEditMessage}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit {editMessageDialog.type === 'complete' ? 'Complete' :
                editMessageDialog.type === 'terminate' ? 'Terminate' :
                editMessageDialog.type === 'quotaFull' ? 'Quota Full' :
                'Security Term'} Page Message
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Message"
            multiline
            rows={6}
            fullWidth
            value={editMessageDialog.message}
            onChange={(e) => setEditMessageDialog({ ...editMessageDialog, message: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditMessage}>Cancel</Button>
          <Button onClick={handleUpdateMessage} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveyDetail;