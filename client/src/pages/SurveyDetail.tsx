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
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  People,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
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
  clientUrls: { name: string; url: string; urlSlug: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completePageMessage: string;
  terminatePageMessage: string;
  quotaFullPageMessage: string;
  securityTermPageMessage: string;
  screenerQuestions?: ScreenerQuestion[];
}

interface ScreenerOption {
  text: string;
  // 'continue' | 'terminate' | 'quota_full' | 'survey:<urlSlug>'
  action: string;
}

interface ScreenerQuestion {
  questionText: string;
  order: number;
  type: 'text' | 'number' | 'textarea' | 'mcq';
  required: boolean;
  options: ScreenerOption[];
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
  const [configData, setConfigData] = useState<{
    clientUrl: string;
    clientUrls: { name: string; url: string; urlSlug: string }[];
    isActive: boolean;
  }>({
    clientUrl: '',
    clientUrls: [],
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
  const [screenerQuestions, setScreenerQuestions] = useState<ScreenerQuestion[]>([]);
  const [savingScreener, setSavingScreener] = useState(false);

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
        clientUrl: surveyData.clientUrl || '',
        clientUrls: surveyData.clientUrls || [],
        isActive: surveyData.isActive
      });
      setScreenerQuestions(surveyData.screenerQuestions || []);
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

  // ── Screener question handlers ──────────────────────────────────────────────
  const addScreenerQuestion = () => {
    setScreenerQuestions([
      ...screenerQuestions,
      {
        questionText: '',
        order: screenerQuestions.length,
        type: 'mcq',
        required: true,
        options: [
          { text: '', action: 'continue' },
          { text: '', action: 'continue' }
        ]
      }
    ]);
  };

  const loadRecommendedQuestions = () => {
    if (screenerQuestions.length > 0 &&
      !window.confirm('This will replace your current questions with a recommended starter set. Continue?')) {
      return;
    }
    setScreenerQuestions([
      { questionText: 'Full Name', order: 0, type: 'text', required: true, options: [] },
      { questionText: 'Age', order: 1, type: 'number', required: true, options: [] },
      {
        questionText: 'Gender', order: 2, type: 'mcq', required: true, options: [
          { text: 'Male', action: 'continue' },
          { text: 'Female', action: 'continue' },
          { text: 'Prefer not to say', action: 'continue' }
        ]
      },
      { questionText: 'City / Location', order: 3, type: 'text', required: true, options: [] },
      { questionText: 'Address', order: 4, type: 'textarea', required: false, options: [] },
      {
        questionText: 'Highest Qualification', order: 5, type: 'mcq', required: false, options: [
          { text: 'High School', action: 'continue' },
          { text: 'Graduate', action: 'continue' },
          { text: 'Post Graduate', action: 'continue' },
          { text: 'Doctorate', action: 'continue' },
          { text: 'Other', action: 'continue' }
        ]
      },
      {
        questionText: 'Do you or any family member work in any of the following industries?',
        order: 6, type: 'mcq', required: true, options: [
          { text: 'Market Research', action: 'terminate' },
          { text: 'Advertising / PR', action: 'terminate' },
          { text: 'Journalism / Media', action: 'terminate' },
          { text: 'None of the above', action: 'continue' }
        ]
      },
      {
        questionText: 'What is your profession?', order: 7, type: 'mcq', required: true, options: [
          { text: 'Option A — set routing', action: 'continue' },
          { text: 'Option B — set routing', action: 'continue' },
          { text: 'None of these', action: 'terminate' }
        ]
      }
    ]);
  };

  const removeScreenerQuestion = (qi: number) => {
    setScreenerQuestions(screenerQuestions.filter((_, i) => i !== qi).map((q, i) => ({ ...q, order: i })));
  };

  const updateQuestionText = (qi: number, text: string) => {
    const updated = [...screenerQuestions];
    updated[qi] = { ...updated[qi], questionText: text };
    setScreenerQuestions(updated);
  };

  const updateQuestionType = (qi: number, type: ScreenerQuestion['type']) => {
    const updated = [...screenerQuestions];
    const q = { ...updated[qi], type };
    // Ensure MCQ has at least 2 options; non-mcq clears options
    if (type === 'mcq') {
      if (!q.options || q.options.length < 2) {
        q.options = [{ text: '', action: 'continue' }, { text: '', action: 'continue' }];
      }
    } else {
      q.options = [];
    }
    updated[qi] = q;
    setScreenerQuestions(updated);
  };

  const updateQuestionRequired = (qi: number, required: boolean) => {
    const updated = [...screenerQuestions];
    updated[qi] = { ...updated[qi], required };
    setScreenerQuestions(updated);
  };

  const addOption = (qi: number) => {
    const updated = [...screenerQuestions];
    updated[qi] = { ...updated[qi], options: [...updated[qi].options, { text: '', action: 'continue' }] };
    setScreenerQuestions(updated);
  };

  const removeOption = (qi: number, oi: number) => {
    const updated = [...screenerQuestions];
    updated[qi] = { ...updated[qi], options: updated[qi].options.filter((_, i) => i !== oi) };
    setScreenerQuestions(updated);
  };

  const updateOption = (qi: number, oi: number, field: 'text' | 'action', value: string) => {
    const updated = [...screenerQuestions];
    const opts = [...updated[qi].options];
    opts[oi] = { ...opts[oi], [field]: value };
    updated[qi] = { ...updated[qi], options: opts };
    setScreenerQuestions(updated);
  };

  const handleSaveScreener = async () => {
    // Validation
    for (let qi = 0; qi < screenerQuestions.length; qi++) {
      const q = screenerQuestions[qi];
      if (!q.questionText.trim()) {
        alert(`Question ${qi + 1} is missing its text.`);
        return;
      }
      // Only MCQ questions need options
      if (q.type === 'mcq') {
        const validOptions = q.options.filter(o => o.text.trim());
        if (validOptions.length < 2) {
          alert(`Question ${qi + 1} (multiple choice) needs at least 2 options.`);
          return;
        }
      }
    }

    setSavingScreener(true);
    try {
      const cleaned = screenerQuestions.map((q, i) => ({
        questionText: q.questionText.trim(),
        order: i,
        type: q.type,
        required: q.required,
        options: q.type === 'mcq'
          ? q.options.filter(o => o.text.trim()).map(o => ({ text: o.text.trim(), action: o.action }))
          : []
      }));
      await axios.put(`/surveys/${id}`, { screenerQuestions: cleaned });
      await fetchSurveyDetails();
      alert('Screener questions saved successfully!');
    } catch (error) {
      console.error('Failed to save screener questions:', error);
      alert('Failed to save screener questions. Please try again.');
    } finally {
      setSavingScreener(false);
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
        <Tab label="Screener Questions" />
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

      {/* Screener Questions Tab */}
      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6">Screener Questions</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="text" onClick={loadRecommendedQuestions}>Load Recommended</Button>
                <Button variant="outlined" onClick={addScreenerQuestion}>+ Add Question</Button>
              </Box>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              These questions are shown to the respondent <strong>before</strong> the survey, all on one page.
              Use <strong>Short Text / Number / Long Text</strong> for profile fields (name, age, address), and <strong>Multiple Choice</strong> for
              qualifying questions. On a multiple-choice option you can set <strong>Terminate</strong>, <strong>Quota Full</strong>, or <strong>Go to a specific survey link</strong>.
              Leave empty to skip screening entirely.
            </Alert>

            {screenerQuestions.length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                No screener questions yet. Click "Load Recommended" for a starter set, or "+ Add Question".
              </Typography>
            )}

            {screenerQuestions.map((q, qi) => (
              <Box key={qi} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2.5, mb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary">
                    Question {qi + 1}
                  </Typography>
                  <Button size="small" color="error" onClick={() => removeScreenerQuestion(qi)}>
                    Remove Question
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label="Question Text"
                  placeholder="e.g. What is your profession?"
                  value={q.questionText}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    select
                    label="Question Type"
                    value={q.type}
                    onChange={(e) => updateQuestionType(qi, e.target.value as ScreenerQuestion['type'])}
                    sx={{ width: 200 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="text">Short Text</option>
                    <option value="number">Number</option>
                    <option value="textarea">Long Text</option>
                    <option value="mcq">Multiple Choice</option>
                  </TextField>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={q.required}
                        onChange={(e) => updateQuestionRequired(qi, e.target.checked)}
                      />
                    }
                    label={q.required ? 'Required' : 'Optional'}
                  />
                </Box>

                {q.type === 'mcq' ? (
                  <>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      Answer Options
                    </Typography>

                    {q.options.map((opt, oi) => (
                      <Box key={oi} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                        <TextField
                          size="small"
                          label={`Option ${oi + 1}`}
                          placeholder="e.g. Dettol"
                          value={opt.text}
                          onChange={(e) => updateOption(qi, oi, 'text', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          select
                          label="Action"
                          value={opt.action}
                          onChange={(e) => updateOption(qi, oi, 'action', e.target.value)}
                          sx={{ width: 230 }}
                          SelectProps={{ native: true }}
                          helperText={opt.action.startsWith('survey:') ? 'Qualifies & opens this survey link' : ' '}
                        >
                          <option value="continue">Continue (default survey)</option>
                          <option value="terminate">Terminate</option>
                          <option value="quota_full">Quota Full</option>
                          {(survey?.clientUrls || []).map((cu) => (
                            <option key={cu.urlSlug} value={`survey:${cu.urlSlug}`}>
                              Go to: {cu.name}
                            </option>
                          ))}
                        </TextField>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeOption(qi, oi)}
                          disabled={q.options.length <= 2}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}

                    <Button size="small" onClick={() => addOption(qi)} sx={{ mt: 0.5 }}>
                      + Add Option
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                    The respondent will type their answer in a {q.type === 'number' ? 'number' : q.type === 'textarea' ? 'multi-line text' : 'text'} field. No qualifying logic on this type.
                  </Typography>
                )}
              </Box>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveScreener}
                disabled={savingScreener}
              >
                {savingScreener ? 'Saving...' : 'Save Screener Questions'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Configuration Tab */}
      {tabValue === 5 && statusUrls && (
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Client Survey URLs
                    </Typography>
                    {editingConfig && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setConfigData({
                          ...configData,
                          clientUrls: [...configData.clientUrls, { name: '', url: '', urlSlug: '' }]
                        })}
                      >
                        + Add Survey URL
                      </Button>
                    )}
                  </Box>

                  {editingConfig ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {configData.clientUrls.length === 0 && (
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          No URLs added yet. Click "+ Add Survey URL" to add one.
                        </Typography>
                      )}
                      {configData.clientUrls.map((entry, idx) => (
                        <Box key={idx} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600} color="primary">
                              URL #{idx + 1}
                            </Typography>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => setConfigData({
                                ...configData,
                                clientUrls: configData.clientUrls.filter((_, i) => i !== idx)
                              })}
                            >
                              Remove
                            </Button>
                          </Box>
                          <TextField
                            fullWidth
                            size="small"
                            label="Name / Audience"
                            placeholder="e.g. IND Cardiovascular Surgeons"
                            value={entry.name}
                            onChange={(e) => {
                              const updated = [...configData.clientUrls];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setConfigData({ ...configData, clientUrls: updated });
                            }}
                            sx={{ mb: 1.5 }}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Survey URL"
                            placeholder="https://hub.m3globalresearch.com/test/XXXXX/"
                            value={entry.url}
                            onChange={(e) => {
                              const updated = [...configData.clientUrls];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setConfigData({ ...configData, clientUrls: updated });
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(survey.clientUrls && survey.clientUrls.length > 0) ? survey.clientUrls.map((entry, idx) => (
                        <Box key={idx} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>{entry.name}</Typography>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                            {entry.url}
                          </Typography>
                        </Box>
                      )) : (
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace' }}>
                          {survey.clientUrl || '—'}
                        </Box>
                      )}
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
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Instructions for Client:
                    </Typography>
                    <Typography variant="body2" component="div">
                      Configure your survey to redirect to these URLs when respondents finish:
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
                            clientUrl: survey.clientUrl || '',
                            clientUrls: survey.clientUrls || [],
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