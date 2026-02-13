import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

interface SurveyDetails {
  _id: string;
  name: string;
  completePageMessage: string;
  terminatePageMessage: string;
  quotaFullPageMessage: string;
  securityTermPageMessage: string;
}

const StatusPreview: React.FC = () => {
  const { id, status } = useParams<{ id: string; status: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SurveyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const response = await axios.get(`/surveys/${id}`);
      setSurvey(response.data.data);
    } catch (error) {
      console.error('Failed to fetch survey:', error);
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

  if (!survey) {
    return (
      <Box>
        <Typography>Survey not found</Typography>
      </Box>
    );
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          title: 'Complete',
          message: survey.completePageMessage,
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          statusCode: '1'
        };
      case 'terminate':
        return {
          title: 'Terminate',
          message: survey.terminatePageMessage,
          backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          statusCode: '2'
        };
      case 'quota-full':
        return {
          title: 'Quota Full',
          message: survey.quotaFullPageMessage,
          backgroundColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          statusCode: '3'
        };
      case 'security':
        return {
          title: 'Security Term',
          message: survey.securityTermPageMessage,
          backgroundColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          statusCode: '4'
        };
      default:
        return {
          title: 'Unknown Status',
          message: '',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          statusCode: '0'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: config.backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20
        }}
      >
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/surveys/${id}`)}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            color: '#333',
            '&:hover': {
              bgcolor: 'white'
            }
          }}
        >
          Back to Survey
        </Button>
      </Box>

      <Box
        sx={{
          background: 'white',
          padding: 8,
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: 900,
          width: '90%',
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ color: '#333', fontWeight: 'bold', mb: 2 }}>
          {config.title} - {survey.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#999',
            mb: 4,
            fontSize: '16px'
          }}
        >
          Status Code: {config.statusCode}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: '#666',
            lineHeight: 1.8,
            fontSize: '18px',
            whiteSpace: 'pre-wrap'
          }}
        >
          {config.message}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatusPreview;
