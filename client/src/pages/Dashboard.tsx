import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

interface Stats {
  totalSurveys: number;
  activeSurveys: number;
  totalVendors: number;
  totalSessions: number;
  completedSessions: number;
  quotaFullSessions: number;
  terminatedSessions: number;
  todaySessions: number;
  conversionRate: number;
}

interface RecentSession {
  _id: string;
  surveyName: string;
  vendorName: string;
  status: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd have a dedicated dashboard endpoint
      const [surveysRes, sessionsRes] = await Promise.all([
        axios.get('/surveys'),
        axios.get('/sessions/recent') // This endpoint would need to be implemented
      ]);

      // Calculate stats from the data
      const surveys = surveysRes.data.data;
      const sessions = sessionsRes.data.data || [];

      const calculatedStats: Stats = {
        totalSurveys: surveys.length,
        activeSurveys: surveys.filter((s: any) => s.isActive).length,
        totalVendors: surveys.reduce((acc: number, s: any) => acc + (s.vendorCount || 0), 0),
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s: any) => s.status === 'complete').length,
        quotaFullSessions: sessions.filter((s: any) => s.status === 'quota_full').length,
        terminatedSessions: sessions.filter((s: any) => s.status === 'terminate').length,
        todaySessions: sessions.filter((s: any) => {
          const today = new Date();
          const sessionDate = new Date(s.createdAt);
          return sessionDate.toDateString() === today.toDateString();
        }).length,
        conversionRate: sessions.length > 0
          ? (sessions.filter((s: any) => s.status === 'complete').length / sessions.length) * 100
          : 0
      };

      setStats(calculatedStats);
      setRecentSessions(sessions.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default values in case of error
      setStats({
        totalSurveys: 0,
        activeSurveys: 0,
        totalVendors: 0,
        totalSessions: 0,
        completedSessions: 0,
        quotaFullSessions: 0,
        terminatedSessions: 0,
        todaySessions: 0,
        conversionRate: 0
      });
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

  const pieData = [
    { name: 'Completed', value: stats?.completedSessions || 0, color: '#4caf50' },
    { name: 'Quota Full', value: stats?.quotaFullSessions || 0, color: '#ff9800' },
    { name: 'Terminated', value: stats?.terminatedSessions || 0, color: '#f44336' },
  ];

  const timeSeriesData = [
    { name: 'Mon', sessions: 45, completed: 20 },
    { name: 'Tue', sessions: 52, completed: 28 },
    { name: 'Wed', sessions: 48, completed: 22 },
    { name: 'Thu', sessions: 65, completed: 35 },
    { name: 'Fri', sessions: 58, completed: 30 },
    { name: 'Sat', sessions: 35, completed: 15 },
    { name: 'Sun', sessions: 30, completed: 12 },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Surveys
              </Typography>
              <Typography variant="h3">
                {stats?.activeSurveys}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of {stats?.totalSurveys} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Vendors
              </Typography>
              <Typography variant="h3">
                {stats?.totalVendors}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                across all surveys
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Sessions
              </Typography>
              <Typography variant="h3">
                {stats?.todaySessions}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                total sessions today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h3">
                {stats?.conversionRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Status Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Session Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sessions Time Series */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Session Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="#8884d8" name="Total Sessions" />
                <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Sessions Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Sessions
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Survey</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>{session.surveyName}</TableCell>
                        <TableCell>{session.vendorName}</TableCell>
                        <TableCell>
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor:
                                session.status === 'complete' ? '#e8f5e9' :
                                session.status === 'quota_full' ? '#fff3e0' :
                                '#ffebee',
                              color:
                                session.status === 'complete' ? '#2e7d32' :
                                session.status === 'quota_full' ? '#e65100' :
                                '#c62828',
                              fontSize: '0.875rem'
                            }}
                          >
                            {session.status}
                          </Box>
                        </TableCell>
                        <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent sessions
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;