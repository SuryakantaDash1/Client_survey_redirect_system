import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

interface Session {
  _id: string;
  sessionId: string;
  surveyId: {
    _id: string;
    name: string;
  } | null;
  vendorId: {
    _id: string;
    name: string;
  } | null;
  status: string;
  queryParams: Map<string, any>;
  ipAddress: string;
  userAgent: string;
  entryTime: string;
  exitTime?: string;
  createdAt: string;
}

const TerminatedSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    totalTerminated: 0,
    todayTerminated: 0,
    avgDuration: 0
  });

  useEffect(() => {
    fetchTerminatedSessions();
  }, [page, rowsPerPage]);

  const fetchTerminatedSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: 'terminate',
        limit: rowsPerPage,
        page: page + 1
      };

      const response = await axios.get('/sessions', { params });
      const terminatedSessions = response.data.data || [];
      setSessions(terminatedSessions);
      setTotalCount(response.data.total || 0);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySessions = terminatedSessions.filter(
        (s: Session) => new Date(s.createdAt) >= today
      );

      let totalDuration = 0;
      let sessionCount = 0;
      terminatedSessions.forEach((session: Session) => {
        if (session.exitTime) {
          const duration = new Date(session.exitTime).getTime() - new Date(session.entryTime).getTime();
          totalDuration += duration;
          sessionCount++;
        }
      });

      setStats({
        totalTerminated: response.data.total || terminatedSessions.length,
        todayTerminated: todaySessions.length,
        avgDuration: sessionCount > 0 ? Math.floor(totalDuration / sessionCount / 1000 / 60) : 0
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch terminated sessions');
      console.error('Error fetching terminated sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSessionDuration = (session: Session) => {
    if (!session.exitTime) return '-';
    const duration = new Date(session.exitTime).getTime() - new Date(session.entryTime).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelIcon color="error" fontSize="large" />
          Terminated Sessions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View all terminated survey sessions (disqualified or incomplete)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Terminated
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.totalTerminated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All-time terminated sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Today's Terminations
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.todayTerminated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sessions terminated today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Duration
              </Typography>
              <Typography variant="h4">
                {stats.avgDuration}m
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Minutes before termination
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Session ID</TableCell>
                <TableCell>Survey Name</TableCell>
                <TableCell>Vendor Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Termination Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No terminated sessions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {session.sessionId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {session.surveyId?.name || 'Unknown Survey'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {session.vendorId?.name || 'Unknown Vendor'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<CancelIcon fontSize="small" />}
                        label="Terminated"
                        color="error"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{format(new Date(session.entryTime), 'MMM dd, HH:mm:ss')}</TableCell>
                    <TableCell>
                      {session.exitTime
                        ? format(new Date(session.exitTime), 'MMM dd, HH:mm:ss')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main">
                        {getSessionDuration(session)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {session.ipAddress}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default TerminatedSessions;