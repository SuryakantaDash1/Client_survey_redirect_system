import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Button,
  TablePagination,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  HourglassEmpty as HourglassIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
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
  status: 'active' | 'complete' | 'terminate' | 'quota_full';
  queryParams: Map<string, any>;
  ipAddress: string;
  userAgent: string;
  entryTime: string;
  exitTime?: string;
  createdAt: string;
}

interface Survey {
  _id: string;
  name: string;
}

interface Vendor {
  _id: string;
  name: string;
  surveyId?: {
    _id: string;
    name: string;
  } | string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const statusConfig = {
  active: {
    color: 'info' as const,
    icon: <HourglassIcon fontSize="small" />,
    label: 'Active'
  },
  complete: {
    color: 'success' as const,
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Completed'
  },
  terminate: {
    color: 'error' as const,
    icon: <CancelIcon fontSize="small" />,
    label: 'Terminated'
  },
  quota_full: {
    color: 'warning' as const,
    icon: <BlockIcon fontSize="small" />,
    label: 'Quota Full'
  }
};

const Sessions: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Filter states
  const [selectedSurvey, setSelectedSurvey] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const statusTabs = ['all', 'active', 'complete', 'terminate', 'quota_full'];

  useEffect(() => {
    fetchData();
    fetchFilters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, tabValue, selectedSurvey, selectedVendor]);

  // Filter vendors when survey changes
  useEffect(() => {
    if (selectedSurvey === 'all') {
      setFilteredVendors(vendors);
      setSelectedVendor('all');
    } else {
      // Filter vendors for selected survey
      const surveyVendors = vendors.filter(vendor => {
        if (!vendor.surveyId) return false;
        // Handle both object and string formats
        if (typeof vendor.surveyId === 'string') {
          return vendor.surveyId === selectedSurvey;
        } else {
          return vendor.surveyId._id === selectedSurvey;
        }
      });
      setFilteredVendors(surveyVendors);
      setSelectedVendor('all');
    }
  }, [selectedSurvey, vendors]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 500  // Get more sessions for better filtering
      };

      const response = await axios.get('/sessions', { params });
      setSessions(response.data.data || []);
      setTotalCount(response.data.total || response.data.data?.length || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [surveysRes, vendorsRes] = await Promise.all([
        axios.get('/surveys'),
        axios.get('/vendors')
      ]);

      console.log('Surveys response:', surveysRes.data);
      console.log('Vendors response:', vendorsRes.data);

      // Set surveys
      const surveysList = surveysRes.data.data || [];
      setSurveys(surveysList);

      // Set vendors directly from the response
      const vendorsList = vendorsRes.data.data || [];
      setVendors(vendorsList);

      console.log('Surveys set:', surveysList.length);
      console.log('Vendors set:', vendorsList.length);
    } catch (err: any) {
      console.error('Error fetching filters:', err);
      // If vendors endpoint fails, try to get vendors from each survey
      try {
        const surveysRes = await axios.get('/surveys');
        const surveysList = surveysRes.data.data || [];
        setSurveys(surveysList);

        // Fallback: get vendors from each survey
        const allVendors: Vendor[] = [];
        const vendorMap = new Map();

        for (const survey of surveysList) {
          try {
            const vendorsRes = await axios.get(`/surveys/${survey._id}/vendors`);
            if (vendorsRes.data.data) {
              vendorsRes.data.data.forEach((vendor: Vendor) => {
                if (!vendorMap.has(vendor._id)) {
                  vendorMap.set(vendor._id, vendor);
                  allVendors.push(vendor);
                }
              });
            }
          } catch (vendorErr) {
            console.error(`Error fetching vendors for survey ${survey._id}:`, vendorErr);
          }
        }

        setVendors(allVendors);
      } catch (fallbackErr) {
        console.error('Fallback vendor fetching failed:', fallbackErr);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filter by status tab
    if (tabValue !== 0) {
      const status = statusTabs[tabValue];
      filtered = filtered.filter(session => session.status === status);
    }

    // Filter by survey
    if (selectedSurvey !== 'all') {
      filtered = filtered.filter(session => session.surveyId?._id === selectedSurvey);
    }

    // Filter by vendor
    if (selectedVendor !== 'all') {
      filtered = filtered.filter(session => session.vendorId?._id === selectedVendor);
    }

    setFilteredSessions(filtered);
    setPage(0);  // Reset to first page when filters change
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSelectedSurvey('all');
    setSelectedVendor('all');
    setTabValue(0);
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

  const getStatusChip = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const getStatsCounts = () => {
    // Filter sessions based on selected survey and vendor first
    let baseFilteredSessions = [...sessions];

    // Apply survey filter
    if (selectedSurvey !== 'all') {
      baseFilteredSessions = baseFilteredSessions.filter(session => session.surveyId?._id === selectedSurvey);
    }

    // Apply vendor filter
    if (selectedVendor !== 'all') {
      baseFilteredSessions = baseFilteredSessions.filter(session => session.vendorId?._id === selectedVendor);
    }

    // Now count from the filtered sessions
    const counts = {
      all: baseFilteredSessions.length,
      active: baseFilteredSessions.filter(s => s.status === 'active').length,
      complete: baseFilteredSessions.filter(s => s.status === 'complete').length,
      terminate: baseFilteredSessions.filter(s => s.status === 'terminate').length,
      quota_full: baseFilteredSessions.filter(s => s.status === 'quota_full').length
    };
    return counts;
  };

  const counts = getStatsCounts();

  const paginatedSessions = filteredSessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sessions Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all survey sessions with their completion status
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Survey</InputLabel>
              <Select
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(e.target.value)}
                label="Survey"
              >
                <MenuItem value="all">All Surveys</MenuItem>
                {surveys.map((survey) => (
                  <MenuItem key={survey._id} value={survey._id}>
                    {survey.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Vendor</InputLabel>
              <Select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                label="Vendor"
                disabled={filteredVendors.length === 0}
              >
                <MenuItem value="all">All Vendors</MenuItem>
                {filteredVendors.map((vendor) => (
                  <MenuItem key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ClearAllIcon />}
                onClick={handleClearFilters}
                size="small"
              >
                Clear
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                size="small"
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Tabs */}
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="session status tabs">
            <Tab label={`All (${counts.all})`} />
            <Tab label={`Active (${counts.active})`} icon={<HourglassIcon />} iconPosition="start" />
            <Tab label={`Completed (${counts.complete})`} icon={<CheckCircleIcon />} iconPosition="start" />
            <Tab label={`Terminated (${counts.terminate})`} icon={<CancelIcon />} iconPosition="start" />
            <Tab label={`Quota Full (${counts.quota_full})`} icon={<BlockIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Session ID</TableCell>
                <TableCell>Survey</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Exit Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No sessions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSessions.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>
                      <Tooltip title={session.sessionId}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {session.sessionId.substring(0, 8)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{session.surveyId?.name || 'Unknown'}</TableCell>
                    <TableCell>{session.vendorId?.name || 'Unknown'}</TableCell>
                    <TableCell>{getStatusChip(session.status)}</TableCell>
                    <TableCell>{format(new Date(session.entryTime), 'MMM dd, HH:mm:ss')}</TableCell>
                    <TableCell>
                      {session.exitTime
                        ? format(new Date(session.exitTime), 'MMM dd, HH:mm:ss')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getSessionDuration(session)}</TableCell>
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
            count={filteredSessions.length}
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

export default Sessions;