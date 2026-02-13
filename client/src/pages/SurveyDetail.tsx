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
  Tab
} from '@mui/material';
import {
  ArrowBack,
  People
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
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchSurveyDetails();
  }, [id]);

  const fetchSurveyDetails = async () => {
    try {
      const [surveyRes, statsRes, vendorsRes] = await Promise.all([
        axios.get(`/surveys/${id}`),
        axios.get(`/surveys/${id}/stats`),
        axios.get(`/surveys/${id}/vendors`)
      ]);
      setSurvey(surveyRes.data.data);
      setStats(statsRes.data.data);
      setVendors(vendorsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch survey details:', error);
    } finally {
      setLoading(false);
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

      {/* Thank You Pages Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#e8f5e9', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  Complete Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 1
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.completePageMessage}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#ffebee', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#c62828', fontWeight: 'bold' }}>
                  Terminate Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 2
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.terminatePageMessage}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#fff3e0', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#e65100', fontWeight: 'bold' }}>
                  Quota Full Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 3
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.quotaFullPageMessage}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: '#f3e5f5', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                  Security Term Page
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Status Code: 4
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                  {survey.securityTermPageMessage}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Configuration Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Survey Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Client Survey URL
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, fontFamily: 'monospace' }}>
                    {survey.clientUrl}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {survey.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {new Date(survey.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SurveyDetail;