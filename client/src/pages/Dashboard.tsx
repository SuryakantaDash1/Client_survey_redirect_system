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
      // Fetch surveys and get vendor count
      const surveysRes = await axios.get('/surveys');
      const surveys = surveysRes.data.data || [];

      // Calculate vendor count by fetching vendors for each survey
      let totalVendors = 0;
      for (const survey of surveys) {
        try {
          const vendorsRes = await axios.get(`/surveys/${survey._id}/vendors`);
          totalVendors += vendorsRes.data.data?.length || 0;
        } catch (err) {
          console.error('Error fetching vendors for survey:', survey._id);
        }
      }

      // Fetch session stats and recent sessions
      let sessionStats = null;
      let recentSessionsData = [];

      try {
        const [statsRes, recentRes] = await Promise.all([
          axios.get('/sessions/stats'),
          axios.get('/sessions/recent?limit=50')  // Get more sessions for weekly chart
        ]);
        sessionStats = statsRes.data.data;
        recentSessionsData = recentRes.data.data || [];
      } catch (error) {
        console.error('Failed to fetch session data:', error);
      }

      const calculatedStats: Stats = {
        totalSurveys: surveys.length,
        activeSurveys: surveys.filter((s: any) => s.isActive).length,
        totalVendors: totalVendors,
        totalSessions: sessionStats?.totalSessions || 0,
        completedSessions: sessionStats?.completedSessions || 0,
        quotaFullSessions: sessionStats?.quotaFullSessions || 0,
        terminatedSessions: sessionStats?.terminatedSessions || 0,
        todaySessions: sessionStats?.todaySessions || 0,
        conversionRate: parseFloat(sessionStats?.conversionRate || 0)
      };

      setStats(calculatedStats);
      setRecentSessions(recentSessionsData);
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

  // Calculate weekly session data from recent sessions
  const calculateWeeklyData = () => {
    const weekData = [
      { name: 'Mon', sessions: 0, completed: 0 },
      { name: 'Tue', sessions: 0, completed: 0 },
      { name: 'Wed', sessions: 0, completed: 0 },
      { name: 'Thu', sessions: 0, completed: 0 },
      { name: 'Fri', sessions: 0, completed: 0 },
      { name: 'Sat', sessions: 0, completed: 0 },
      { name: 'Sun', sessions: 0, completed: 0 },
    ];

    // If we have session data, calculate weekly stats
    if (recentSessions.length > 0) {
      recentSessions.forEach(session => {
        const date = new Date(session.createdAt);
        const dayIndex = date.getDay();
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];

        const day = weekData.find(d => d.name === dayName);
        if (day) {
          day.sessions++;
          if (session.status === 'complete') {
            day.completed++;
          }
        }
      });
    }

    return weekData;
  };

  const timeSeriesData = calculateWeeklyData();

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

      </Grid>
    </Box>
  );
};

export default Dashboard;