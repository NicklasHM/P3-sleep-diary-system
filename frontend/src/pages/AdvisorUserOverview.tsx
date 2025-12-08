import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/LanguageToggle';
import { userAPI, responseAPI, questionAPI } from '../services/api';
import type { User, Response, Question, QuestionOption } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdvisorUserOverviewSkeleton from '../components/AdvisorUserOverviewSkeleton';
import Skeleton from '../components/Skeleton';
import './AdvisorUserOverview.css';

const AdvisorUserOverview = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState<User[]>([]);
  const [allCitizens, setAllCitizens] = useState<User[]>([]);
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterAdvisor, setFilterAdvisor] = useState<string>('');
  const [assigningAdvisor, setAssigningAdvisor] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Map<string, string>>(new Map());
  const [citizenSleepData, setCitizenSleepData] = useState<Map<string, any>>(new Map());
  const [selectedCitizen, setSelectedCitizen] = useState<User | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [allResponses, setAllResponses] = useState<Response[]>([]);
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [allSleepData, setAllSleepData] = useState<any[]>([]);
  const [sleepDataMap, setSleepDataMap] = useState<Map<string, any>>(new Map());
  const [questions, setQuestions] = useState<Map<string, Question>>(new Map());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCitizens();
  }, [searchName, filterAdvisor, allCitizens]);

  // Genindlæs spørgsmål når sproget skifter
  useEffect(() => {
    if (selectedCitizen && allResponses.length > 0) {
      const reloadQuestions = async () => {
        try {
          const questionsMap = new Map<string, Question>();
          for (const response of allResponses) {
            try {
              // Brug includeDeleted=true for at hente også slettede spørgsmål
              const questionsList = await questionAPI.getQuestions(response.questionnaireId, language, true);
              questionsList.forEach((q: Question) => {
                questionsMap.set(q.id, q);
              });
            } catch (err) {
              // Ignore errors loading questions
            }
          }
          setQuestions(questionsMap);
        } catch (err) {
          // Ignore errors
        }
      };
      reloadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, selectedCitizen, allResponses]);

  const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString || !timeString.includes(':')) {
      return 0;
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload || !payload.length) return null;

    // Map af strokeDasharray for hver linje
    const dashArrayMap: { [key: string]: string } = {
      'SOL (min)': '0',
      'WASO (min)': '5 5',
      'TIB': '10 5',
      'TST': '5 5 1 5'
    };

    return (
      <ul className="custom-legend">
        {payload.map((entry: any, index: number) => {
          const dashArray = dashArrayMap[entry.value] || '0';
          return (
            <li key={`legend-item-${index}`} className="custom-legend-item">
              <svg width="24" height="12" style={{ display: 'block' }}>
                <line
                  x1="0"
                  y1="6"
                  x2="24"
                  y2="6"
                  stroke={entry.color}
                  strokeWidth={2}
                  strokeDasharray={dashArray}
                />
              </svg>
              <span style={{ color: entry.color }}>{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [citizensData, advisorsData] = await Promise.all([
        userAPI.getAllCitizens(),
        userAPI.getAllAdvisors()
      ]);
      
      setAllCitizens(citizensData);
      setCitizens(citizensData);
      setAdvisors(advisorsData);
      
      // Load sleep data for all citizens and calculate averages
      const sleepDataMap = new Map<string, any>();
      for (const citizen of citizensData) {
        try {
          const sleepResponse = await userAPI.getSleepData(citizen.id);
          if (sleepResponse.sleepData && sleepResponse.sleepData.length > 0) {
            // Calculate average for all sleep data
            const allSleepData = sleepResponse.sleepData;
            let totalSOL = 0;
            let totalWASO = 0;
            let totalTIBMinutes = 0;
            let totalTSTMinutes = 0;
            let count = 0;

            allSleepData.forEach((data: any) => {
              if (data && data.sleepParameters) {
                const params = data.sleepParameters;
                const tibMinutes = typeof params.TIB === 'string' 
                  ? parseTimeToMinutes(params.TIB) 
                  : (params.TIBMinutes || params.TIB || 0);
                const tstMinutes = typeof params.TST === 'string' 
                  ? parseTimeToMinutes(params.TST) 
                  : (params.TSTMinutes || params.TST || 0);
                const solMinutes = params.SOL || 0;
                const wasoMinutes = params.WASO || 0;

                totalSOL += solMinutes;
                totalWASO += wasoMinutes;
                totalTIBMinutes += tibMinutes;
                totalTSTMinutes += tstMinutes;
                count++;
              }
            });

            if (count > 0) {
              const average = {
                sleepParameters: {
                  SOL: Math.round(totalSOL / count),
                  WASO: Math.round(totalWASO / count),
                  TIBMinutes: Math.round(totalTIBMinutes / count),
                  TSTMinutes: Math.round(totalTSTMinutes / count),
                  TIB: formatMinutesToTime(Math.round(totalTIBMinutes / count)),
                  TST: formatMinutesToTime(Math.round(totalTSTMinutes / count))
                }
              };
              sleepDataMap.set(citizen.id, average);
            }
          }
        } catch (err) {
          // Ignore errors loading sleep data for overview
        }
      }
      setCitizenSleepData(sleepDataMap);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke indlæse data');
    } finally {
      setLoading(false);
    }
  };

  const filterCitizens = () => {
    let filtered = [...allCitizens];

    // Filter by name
    if (searchName.trim()) {
      filtered = filtered.filter(citizen =>
        citizen.fullName.toLowerCase().includes(searchName.toLowerCase()) ||
        citizen.username.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by advisor
    if (filterAdvisor) {
      if (filterAdvisor === 'none') {
        filtered = filtered.filter(citizen => !citizen.advisorId);
      } else {
        filtered = filtered.filter(citizen => citizen.advisorId === filterAdvisor);
      }
    }

    setCitizens(filtered);
  };

  const handleAssignAdvisor = async (citizenId: string, advisorId: string | null) => {
    try {
      setAssigningAdvisor(citizenId);
      const updatedCitizen = await userAPI.assignAdvisor(citizenId, advisorId);
      
      // Update the citizen in the list
      setAllCitizens(prev => prev.map(c => 
        c.id === citizenId ? updatedCitizen : c
      ));
      
      // Update selected citizen if it's the same one
      if (selectedCitizen?.id === citizenId) {
        setSelectedCitizen(updatedCitizen);
      }
      
      setSelectedAdvisor(prev => {
        const newMap = new Map(prev);
        if (advisorId) {
          newMap.set(citizenId, advisorId);
        } else {
          newMap.delete(citizenId);
        }
        return newMap;
      });
    } catch (err: any) {
      setError(err.message || t('userOverview.couldNotAssign'));
    } finally {
      setAssigningAdvisor(null);
    }
  };

  const handleSelectCitizen = async (citizen: User) => {
    // Toggle: if same citizen is clicked, close it
    if (selectedCitizen?.id === citizen.id) {
      setSelectedCitizen(null);
      return;
    }
    
    setSelectedCitizen(citizen);
    setExpandedResponses(new Set());
    setStartDate('');
    setEndDate('');
    setLoadingDetails(true);
    
    try {
      // Load responses
      const responsesData = await responseAPI.getResponses(citizen.id);
      
      // Sort responses so newest is first
      const sortedResponses = [...responsesData].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setAllResponses(sortedResponses);
      setResponses(sortedResponses);

      // Load sleep data
      const sleepResponse = await userAPI.getSleepData(citizen.id);
      const sleepDataArray = Array.isArray(sleepResponse.sleepData) ? sleepResponse.sleepData : [];
      setAllSleepData(sleepDataArray);
      setSleepData(sleepDataArray);
      
      // Create map for quick lookup of sleep parameters based on responseId
      const sleepMap = new Map<string, any>();
      sleepDataArray.forEach((data: any) => {
        sleepMap.set(data.responseId, data);
      });
      setSleepDataMap(sleepMap);

      // Fetch questions for all responses (inkl. slettede spørgsmål)
      const questionsMap = new Map<string, Question>();
      for (const response of responsesData) {
        try {
          // Brug includeDeleted=true for at hente også slettede spørgsmål
          const questionsList = await questionAPI.getQuestions(response.questionnaireId, language, true);
          questionsList.forEach((q: Question) => {
            questionsMap.set(q.id, q);
          });
        } catch (err) {
          // Ignore errors loading questions
        }
      }
      setQuestions(questionsMap);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke indlæse data');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter data based on selected period
  useEffect(() => {
    if (!selectedCitizen) {
      // Reset when no citizen is selected
      setSleepData([]);
      return;
    }
    
    // Don't filter if data hasn't been loaded yet
    const sleepDataArray = Array.isArray(allSleepData) ? allSleepData : [];
    if (allResponses.length === 0 && sleepDataArray.length === 0) {
      return;
    }

    const filterData = () => {
      // Ensure allSleepData is always an array
      const sleepDataArray = Array.isArray(allSleepData) ? allSleepData : [];
      
      if (!startDate && !endDate) {
        setResponses(allResponses);
        setSleepData(sleepDataArray);
        return;
      }

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) {
        start.setHours(0, 0, 0, 0);
      }
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      const filteredResponses = allResponses.filter((response) => {
        const responseDate = new Date(response.createdAt);
        if (start && responseDate < start) return false;
        if (end && responseDate > end) return false;
        return true;
      });
      setResponses(filteredResponses);

      const filteredSleepData = sleepDataArray.filter((data: any) => {
        if (!data || !data.createdAt) return false;
        const dataDate = new Date(data.createdAt);
        if (start && dataDate < start) return false;
        if (end && dataDate > end) return false;
        return true;
      });
      setSleepData(filteredSleepData);

      const filteredSleepMap = new Map<string, any>();
      filteredSleepData.forEach((data: any) => {
        if (data && data.responseId) {
          filteredSleepMap.set(data.responseId, data);
        }
      });
      setSleepDataMap(filteredSleepMap);
    };

    filterData();
  }, [startDate, endDate, allResponses, allSleepData, selectedCitizen]);

  const toggleResponse = (responseId: string) => {
    setExpandedResponses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  // Farvekodingsfunktioner baseret på grænseværdier
  type ColorCode = 'red' | 'yellow' | 'green';

  const getTIBColor = (tibMinutes: number): ColorCode => {
    const tibHours = tibMinutes / 60;
    return tibHours <= 6 ? 'red' : 'green';
  };

  const getSOLColor = (solMinutes: number): ColorCode => {
    return solMinutes >= 30 ? 'red' : 'green';
  };

  const getAwakeningsColor = (awakenings: number): ColorCode => {
    if (awakenings >= 0 && awakenings <= 2) return 'green';
    if (awakenings >= 3 && awakenings <= 4) return 'yellow';
    return 'red'; // 5+
  };

  const getWASOColor = (wasoMinutes: number): ColorCode => {
    if (wasoMinutes >= 0 && wasoMinutes <= 29) return 'green';
    if (wasoMinutes >= 30 && wasoMinutes <= 59) return 'yellow';
    return 'red'; // 60+
  };

  const getTSTColor = (tstMinutes: number, tibMinutes: number): ColorCode => {
    if (tibMinutes === 0) return 'red';
    const tstPercentage = (tstMinutes / tibMinutes) * 100;
    if (tstPercentage >= 0 && tstPercentage <= 74) return 'red';
    if (tstPercentage >= 75 && tstPercentage <= 84) return 'yellow';
    return 'green'; // 85+
  };

  const getActivityColor = (activity: number): ColorCode => {
    return activity >= 0 && activity <= 29 ? 'red' : 'green';
  };

  const getAlcoholColor = (alcohol: number): ColorCode => {
    return alcohol === 0 ? 'green' : 'yellow';
  };

  const getDaylightColor = (daylight: number): ColorCode => {
    if (daylight >= 0 && daylight <= 9) return 'red';
    if (daylight >= 10 && daylight <= 29) return 'yellow';
    return 'green'; // 30+
  };

  const getColorClass = (color: ColorCode): string => {
    switch (color) {
      case 'red':
        return 'color-red';
      case 'yellow':
        return 'color-yellow';
      case 'green':
        return 'color-green';
      default:
        return '';
    }
  };

  // Hjælpefunktion til at finde værdi fra svar baseret på spørgsmålstekst
  const findAnswerValueByQuestionText = (response: Response, questionText: string): number | null => {
    const question = Array.from(questions.values()).find(q => 
      q.text.toLowerCase().includes(questionText.toLowerCase())
    );
    if (!question) return null;
    const answer = response.answers[question.id];
    if (answer === null || answer === undefined) return null;
    const numValue = typeof answer === 'number' ? answer : parseFloat(String(answer));
    return isNaN(numValue) ? null : numValue;
  };

  if (loading) {
    return <AdvisorUserOverviewSkeleton />;
  }

  return (
    <div className="advisor-overview">
      <header className="dashboard-header">
        <h1>{t('userOverview.title')}</h1>
        <div className="header-actions">
          <LanguageToggle />
          <button onClick={toggleTheme} className="theme-toggle" title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => navigate('/advisor')} className="btn btn-secondary">
            {t('common.back')}
          </button>
          <button onClick={logout} className="btn btn-secondary">
            {t('common.logout')}
          </button>
        </div>
      </header>

      <div className="container">
        {error && <div className="error-message">{error}</div>}

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-box">
            <label htmlFor="search-name">{t('userOverview.searchName')}</label>
            <input
              type="text"
              id="search-name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t('userOverview.searchPlaceholder')}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <label htmlFor="filter-advisor">{t('userOverview.filterAdvisor')}</label>
            <select
              id="filter-advisor"
              value={filterAdvisor}
              onChange={(e) => setFilterAdvisor(e.target.value)}
              className="filter-select"
            >
              <option value="">{t('userOverview.allCitizens')}</option>
              <option value="none">{t('userOverview.noAdvisor')}</option>
              {advisors.map(advisor => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.fullName || advisor.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Citizens List */}
        <div className="citizens-table-container">
          <div className="citizens-table-header">
            <div className="table-header-cell name-cell">{t('userOverview.tableName')}</div>
            <div className="table-header-cell advisor-cell">{t('userOverview.tableAdvisor')}</div>
            <div className="table-header-cell sleep-cell">{t('userOverview.tableSleepParams')}</div>
            <div className="table-header-cell action-cell">{t('userOverview.tableActions')}</div>
          </div>
          <div className="citizens-table-body">
            {citizens.length === 0 ? (
              <div className="no-citizens">{t('userOverview.noCitizens')}</div>
            ) : (
              citizens.map((citizen) => {
                const latestSleepData = citizenSleepData.get(citizen.id);
                const isAssigning = assigningAdvisor === citizen.id;
                const currentAdvisorId = selectedAdvisor.get(citizen.id) || citizen.advisorId || '';

                const isSelected = selectedCitizen?.id === citizen.id;
                
                return (
                  <React.Fragment key={citizen.id}>
                    <div 
                      className={`citizen-row ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        // Don't trigger if clicking on the action cell
                        if ((e.target as HTMLElement).closest('.action-cell')) {
                          return;
                        }
                        handleSelectCitizen(citizen);
                      }}
                    >
                      <div className="table-cell name-cell clickable-cell">
                        <div className="citizen-name">
                          {citizen.fullName || citizen.username}
                          {isSelected && <span className="expand-indicator">▼</span>}
                        </div>
                      </div>
                      <div className="table-cell advisor-cell clickable-cell">
                        {citizen.advisorName ? (
                          <span className="advisor-name">{citizen.advisorName}</span>
                        ) : (
                          <span className="no-advisor">{t('userOverview.noAdvisor')}</span>
                        )}
                      </div>
                    <div className="table-cell sleep-cell clickable-cell">
                      {latestSleepData ? (() => {
                        const sleepParams = latestSleepData.sleepParameters;
                        const tibMinutes = sleepParams.TIBMinutes || 0;
                        const tstMinutes = sleepParams.TSTMinutes || 0;
                        const solMinutes = sleepParams.SOL || 0;
                        const wasoMinutes = sleepParams.WASO || 0;

                        const solColor = getSOLColor(solMinutes);
                        const wasoColor = getWASOColor(wasoMinutes);
                        const tibColor = getTIBColor(tibMinutes);
                        const tstColor = getTSTColor(tstMinutes, tibMinutes);

                        return (
                          <div className="sleep-params">
                            <div className={`sleep-param-item ${getColorClass(solColor)}`}>
                              <span className="param-label">SOL:</span>
                              <span className="param-value">{solMinutes} min</span>
                            </div>
                            <div className={`sleep-param-item ${getColorClass(wasoColor)}`}>
                              <span className="param-label">WASO:</span>
                              <span className="param-value">{wasoMinutes} min</span>
                            </div>
                            <div className={`sleep-param-item ${getColorClass(tibColor)}`}>
                              <span className="param-label">TIB:</span>
                              <span className="param-value">
                                {sleepParams.TIB || formatMinutesToTime(tibMinutes)}
                              </span>
                            </div>
                            <div className={`sleep-param-item ${getColorClass(tstColor)}`}>
                              <span className="param-label">TST:</span>
                              <span className="param-value">
                                {sleepParams.TST || formatMinutesToTime(tstMinutes)}
                              </span>
                            </div>
                          </div>
                        );
                      })() : (
                        <span className="no-sleep-data">{t('userOverview.noSleepData')}</span>
                      )}
                    </div>
                      <div className="table-cell action-cell">
                        <div className="assign-advisor-control">
                          <select
                            value={currentAdvisorId}
                            onChange={(e) => {
                              const newAdvisorId = e.target.value || null;
                              setSelectedAdvisor(prev => {
                                const newMap = new Map(prev);
                                if (newAdvisorId) {
                                  newMap.set(citizen.id, newAdvisorId);
                                } else {
                                  newMap.delete(citizen.id);
                                }
                                return newMap;
                              });
                              handleAssignAdvisor(citizen.id, newAdvisorId);
                            }}
                            disabled={isAssigning}
                            className="advisor-select"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">{t('userOverview.noAdvisor')}</option>
                            {advisors.map(advisor => (
                              <option key={advisor.id} value={advisor.id}>
                                {advisor.fullName || advisor.username}
                              </option>
                            ))}
                          </select>
                          {isAssigning && <span className="assigning-spinner">...</span>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Citizen Details - shown directly under the selected citizen */}
                    {isSelected && (
                      <div className="citizen-details-expanded">
                        {loadingDetails ? (
                          <div className="loading-details-skeleton">
                            <Skeleton width="100%" height="200px" borderRadius="8px" />
                            <Skeleton width="100%" height="300px" borderRadius="8px" style={{ marginTop: '24px' }} />
                            <Skeleton width="100%" height="150px" borderRadius="8px" style={{ marginTop: '24px' }} />
                          </div>
                        ) : (
                          <>
                            {/* Period Filter */}
                            <div className="period-filter">
                              <h3>{t('userOverview.selectPeriod')}</h3>
                              <div className="date-inputs">
                                <div className="date-input-group">
                                  <label htmlFor="start-date">{t('userOverview.fromDate')}</label>
                                  <input
                                    type="date"
                                    id="start-date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="date-input"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="date-input-group">
                                  <label htmlFor="end-date">{t('userOverview.toDate')}</label>
                                  <input
                                    type="date"
                                    id="end-date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="date-input"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                {(startDate || endDate) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setStartDate('');
                                      setEndDate('');
                                    }}
                                    className="btn-clear-filter"
                                  >
                                    {t('userOverview.clearFilter')}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Graph for sleep parameters */}
                            <div className="details-section">
                              <h3>📊 {t('userOverview.sleepParameters')}</h3>
                              {Array.isArray(sleepData) && sleepData.length > 0 ? (
                                <>
                                  {/* Average for selected period */}
                                  {(() => {
                                    let totalSOL = 0;
                                    let totalWASO = 0;
                                    let totalTIBMinutes = 0;
                                    let totalTSTMinutes = 0;
                                    let count = 0;

                                    sleepData.forEach((data: any) => {
                                      if (data && data.sleepParameters) {
                                        const params = data.sleepParameters;
                                        const tibValue = params.TIBMinutes !== undefined 
                                          ? params.TIBMinutes 
                                          : (typeof params.TIB === 'string' 
                                            ? parseTimeToMinutes(params.TIB) 
                                            : params.TIB || 0);
                                        const tstValue = params.TSTMinutes !== undefined 
                                          ? params.TSTMinutes 
                                          : (typeof params.TST === 'string' 
                                            ? parseTimeToMinutes(params.TST) 
                                            : params.TST || 0);
                                        const solValue = params.SOL || 0;
                                        const wasoValue = params.WASO || 0;

                                        totalSOL += solValue;
                                        totalWASO += wasoValue;
                                        totalTIBMinutes += tibValue;
                                        totalTSTMinutes += tstValue;
                                        count++;
                                      }
                                    });

                                    if (count > 0) {
                                      const avgSOL = Math.round(totalSOL / count);
                                      const avgWASO = Math.round(totalWASO / count);
                                      const avgTIBMinutes = Math.round(totalTIBMinutes / count);
                                      const avgTSTMinutes = Math.round(totalTSTMinutes / count);

                                      const solColor = getSOLColor(avgSOL);
                                      const wasoColor = getWASOColor(avgWASO);
                                      const tibColor = getTIBColor(avgTIBMinutes);
                                      const tstColor = getTSTColor(avgTSTMinutes, avgTIBMinutes);

                                      return (
                                        <div className="period-average-container">
                                          <h4>{t('userOverview.averageForPeriod')}</h4>
                                          <div className="sleep-params">
                                            <div className={`sleep-param-item ${getColorClass(solColor)}`}>
                                              <span className="param-label">SOL:</span>
                                              <span className="param-value">{avgSOL} min</span>
                                            </div>
                                            <div className={`sleep-param-item ${getColorClass(wasoColor)}`}>
                                              <span className="param-label">WASO:</span>
                                              <span className="param-value">{avgWASO} min</span>
                                            </div>
                                            <div className={`sleep-param-item ${getColorClass(tibColor)}`}>
                                              <span className="param-label">TIB:</span>
                                              <span className="param-value">{formatMinutesToTime(avgTIBMinutes)}</span>
                                            </div>
                                            <div className={`sleep-param-item ${getColorClass(tstColor)}`}>
                                              <span className="param-label">TST:</span>
                                              <span className="param-value">{formatMinutesToTime(avgTSTMinutes)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <div className="sleep-chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                      data={sleepData
                                        .map((data: any) => {
                                          if (!data || !data.sleepParameters) return null;
                                          
                                          const tibValue = data.sleepParameters.TIBMinutes !== undefined 
                                            ? data.sleepParameters.TIBMinutes 
                                            : (typeof data.sleepParameters.TIB === 'string' 
                                              ? parseTimeToMinutes(data.sleepParameters.TIB) 
                                              : data.sleepParameters.TIB || 0);
                                          
                                          const tstValue = data.sleepParameters.TSTMinutes !== undefined 
                                            ? data.sleepParameters.TSTMinutes 
                                            : (typeof data.sleepParameters.TST === 'string' 
                                              ? parseTimeToMinutes(data.sleepParameters.TST) 
                                              : data.sleepParameters.TST || 0);
                                          
                                          return {
                                            date: new Date(data.createdAt).toLocaleDateString('da-DK', { 
                                              day: 'numeric', 
                                              month: 'numeric' 
                                            }),
                                            createdAt: data.createdAt, // Gem original dato for sortering
                                            SOL: data.sleepParameters.SOL || 0,
                                            WASO: data.sleepParameters.WASO || 0,
                                            TIB: tibValue,
                                            TST: tstValue,
                                          };
                                        })
                                        .filter((item: any) => item !== null)
                                        .sort((a: any, b: any) => {
                                          // Sorter efter createdAt i stigende rækkefølge (ældste først)
                                          const dateA = new Date(a.createdAt).getTime();
                                          const dateB = new Date(b.createdAt).getTime();
                                          return dateA - dateB;
                                        })
                                        .map((item: any) => {
                                          // Fjern createdAt fra det endelige objekt (kun brugt til sortering)
                                          const { createdAt, ...rest } = item;
                                          return rest;
                                        })}
                                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="date" />
                                      <YAxis 
                                        label={{ value: 'Minutter', angle: -90, position: 'insideLeft' }}
                                      />
                                      <Tooltip 
                                        formatter={(value: number, name: string) => {
                                          if (name === 'TIB' || name === 'TST') {
                                            return formatMinutesToTime(value);
                                          }
                                          return `${value} min`;
                                        }}
                                      />
                                      <Legend content={renderCustomLegend} />
                                      <Line 
                                        type="monotone" 
                                        dataKey="SOL" 
                                        stroke="#003366" 
                                        strokeWidth={2}
                                        strokeDasharray="0"
                                        name="SOL (min)"
                                        dot={{ r: 4 }}
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="WASO" 
                                        stroke="#FF6600" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="WASO (min)"
                                        dot={{ r: 4 }}
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="TIB" 
                                        stroke="#8B008B" 
                                        strokeWidth={2}
                                        strokeDasharray="10 5"
                                        name="TIB"
                                        dot={{ r: 4 }}
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="TST" 
                                        stroke="#006400" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5 1 5"
                                        name="TST"
                                        dot={{ r: 4 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                  </div>
                                </>
                              ) : (
                                <div className="no-sleep-data-message">
                                  <p>{t('userOverview.noSleepDataMessage')}</p>
                                </div>
                              )}
                            </div>

                            <div className="details-section">
                              <h3>{t('userOverview.responses')}</h3>
                              {responses.length === 0 ? (
                                <p>{t('userOverview.noResponses')}</p>
                              ) : (
                                <div className="responses-list">
                                  {responses.map((response) => {
                                    const isExpanded = expandedResponses.has(response.id);
                                    return (
                                      <div key={response.id} className="response-item">
                                        <div 
                                          className="response-header clickable"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleResponse(response.id);
                                          }}
                                        >
                                          <div className="response-header-left">
                                            <span className="response-type">
                                              {response.questionnaireType === 'morning' ? t('userOverview.morning') : t('userOverview.evening')}
                                            </span>
                                            <span className="response-date">
                                              {new Date(response.createdAt).toLocaleString('da-DK')}
                                            </span>
                                          </div>
                                          <span className="expand-icon">
                                            {isExpanded ? '▼' : '▶'}
                                          </span>
                                        </div>
                                        {isExpanded && (
                                          <div className="response-answers">
                                            {/* Show sleep parameters at top if it's a morning response */}
                                            {response.questionnaireType === 'morning' && sleepDataMap.has(response.id) && (
                                              <div className="response-sleep-parameters">
                                                <h4>{t('userOverview.sleepParametersTitle')}</h4>
                                                <div className="sleep-parameters-grid">
                                                  {(() => {
                                                    const sleepParams = sleepDataMap.get(response.id)?.sleepParameters;
                                                    if (!sleepParams) return null;
                                                    
                                                    const tibMinutes = typeof sleepParams.TIB === 'string' 
                                                      ? parseTimeToMinutes(sleepParams.TIB) 
                                                      : (sleepParams.TIBMinutes || sleepParams.TIB || 0);
                                                    const tstMinutes = typeof sleepParams.TST === 'string' 
                                                      ? parseTimeToMinutes(sleepParams.TST) 
                                                      : (sleepParams.TSTMinutes || sleepParams.TST || 0);
                                                    const solMinutes = sleepParams.SOL || 0;
                                                    const wasoMinutes = sleepParams.WASO || 0;

                                                    const solColor = getSOLColor(solMinutes);
                                                    const wasoColor = getWASOColor(wasoMinutes);
                                                    const tibColor = getTIBColor(tibMinutes);
                                                    const tstColor = getTSTColor(tstMinutes, tibMinutes);
                                                    
                                                    return (
                                                      <>
                                                        <div className={`param-card ${getColorClass(solColor)}`}>
                                                          <span className="param-label">SOL:</span>
                                                          <span className="param-value">{solMinutes} min</span>
                                                        </div>
                                                        <div className={`param-card ${getColorClass(wasoColor)}`}>
                                                          <span className="param-label">WASO:</span>
                                                          <span className="param-value">{wasoMinutes} min</span>
                                                        </div>
                                                        <div className={`param-card ${getColorClass(tibColor)}`}>
                                                          <span className="param-label">TIB:</span>
                                                          <span className="param-value">
                                                            {typeof sleepParams.TIB === 'string' 
                                                              ? sleepParams.TIB 
                                                              : formatMinutesToTime(tibMinutes)}
                                                          </span>
                                                        </div>
                                                        <div className={`param-card ${getColorClass(tstColor)}`}>
                                                          <span className="param-label">TST:</span>
                                                          <span className="param-value">
                                                            {typeof sleepParams.TST === 'string' 
                                                              ? sleepParams.TST 
                                                              : formatMinutesToTime(tstMinutes)}
                                                          </span>
                                                        </div>
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            )}
                                            
                                            <h4>{t('userOverview.responses')}</h4>
                                            {Object.entries(response.answers).map(([questionId, answer]) => {
                                              const question = questions.get(questionId);
                                              const questionText = question?.text || `Spørgsmål ${questionId}`;
                                              
                                              let displayAnswer = String(answer);
                                              let answerColor: ColorCode | null = null;
                                              
                                              // Håndter multiple_choice (enkelt valg)
                                              if (question?.type === 'multiple_choice' && question.options) {
                                                let selectedOption: QuestionOption | undefined;
                                                
                                                // Tjek om det er et "Andet" svar (objekt med optionId og customText)
                                                if (typeof answer === 'object' && answer !== null && 'optionId' in answer && 'customText' in answer) {
                                                  selectedOption = question.options.find(opt => opt.id === (answer as any).optionId);
                                                  if (selectedOption?.isOther) {
                                                    displayAnswer = t('userOverview.otherAnswer', { text: (answer as any).customText || '' });
                                                  } else if (selectedOption) {
                                                    displayAnswer = selectedOption.text;
                                                  }
                                                } else {
                                                  // Normal option ID
                                                  selectedOption = question.options.find(opt => opt.id === answer);
                                                  if (selectedOption) {
                                                    displayAnswer = selectedOption.text;
                                                  }
                                                }
                                                
                                                // Brug option's farvekode hvis den findes (for aftenspørgsmål)
                                                if (response.questionnaireType === 'evening' && selectedOption?.colorCode) {
                                                  answerColor = selectedOption.colorCode as ColorCode;
                                                }
                                              }
                                              
                                              // Håndter multiple_choice_multiple (flere valg)
                                              if (question?.type === 'multiple_choice_multiple' && question.options) {
                                                // Håndter både array og kommasepareret streng
                                                let answerItems: any[] = [];
                                                if (Array.isArray(answer)) {
                                                  answerItems = answer;
                                                } else if (typeof answer === 'string' && answer.includes(',')) {
                                                  // Hvis det er en kommasepareret streng (fra test eller gammel data)
                                                  answerItems = answer.split(',').map(id => id.trim());
                                                } else if (answer) {
                                                  // Hvis det er en enkelt værdi
                                                  answerItems = [answer];
                                                }
                                                
                                                // Find alle option tekster og farvekoder, håndter både strings og objekter
                                                const optionTexts: string[] = [];
                                                const optionColorCodes: ColorCode[] = [];
                                                
                                                answerItems.forEach((item: any) => {
                                                  let selectedOption: QuestionOption | undefined;
                                                  
                                                  // Hvis det er et "Andet" objekt
                                                  if (typeof item === 'object' && item !== null && 'optionId' in item && 'customText' in item) {
                                                    selectedOption = question.options?.find(opt => opt.id === item.optionId);
                                                    if (selectedOption?.isOther) {
                                                      optionTexts.push(t('userOverview.otherAnswer', { text: item.customText || '' }));
                                                    } else if (selectedOption) {
                                                      optionTexts.push(selectedOption.text);
                                                    }
                                                  } else {
                                                    // Normal option ID (string)
                                                    selectedOption = question.options?.find(opt => opt.id === item);
                                                    if (selectedOption) {
                                                      optionTexts.push(selectedOption.text);
                                                    }
                                                  }
                                                  
                                                  // Saml farvekoder fra options (for aftenspørgsmål)
                                                  if (response.questionnaireType === 'evening' && selectedOption?.colorCode) {
                                                    optionColorCodes.push(selectedOption.colorCode as ColorCode);
                                                  }
                                                });
                                                
                                                if (optionTexts.length > 0) {
                                                  displayAnswer = optionTexts.join(', ');
                                                }
                                                
                                                // For multiple choice multiple: brug den "værste" farvekode (rød > gul > grøn)
                                                if (response.questionnaireType === 'evening' && optionColorCodes.length > 0) {
                                                  if (optionColorCodes.includes('red')) {
                                                    answerColor = 'red';
                                                  } else if (optionColorCodes.includes('yellow')) {
                                                    answerColor = 'yellow';
                                                  } else {
                                                    answerColor = 'green';
                                                  }
                                                }
                                              }

                                              // Bestem farvekode baseret på spørgsmålstekst og værdi
                                              // NOTE: Morgenspørgsmål skal IKKE have farvekoder - kun søvnparametrene skal have farvekoder
                                              if (question && response.questionnaireType === 'evening') {
                                                const numValue = typeof answer === 'number' ? answer : parseFloat(String(answer));
                                                
                                                // For aftenspørgsmål: brug farvekoder fra spørgsmålet
                                                if (question.hasColorCode && !isNaN(numValue)) {
                                                  const greenMax = question.colorCodeGreenMax;
                                                  const greenMin = question.colorCodeGreenMin;
                                                  const yellowMin = question.colorCodeYellowMin;
                                                  const yellowMax = question.colorCodeYellowMax;
                                                  const redMin = question.colorCodeRedMin;
                                                  const redMax = question.colorCodeRedMax;
                                                  
                                                  // Bestem farvekode baseret på grænseværdier
                                                  // Tjek først grøn (range ligesom gul)
                                                  if (greenMin !== undefined && greenMax !== undefined && 
                                                      numValue >= greenMin && numValue <= greenMax) {
                                                    answerColor = 'green';
                                                  } 
                                                  // Tjek derefter gul
                                                  else if (yellowMin !== undefined && yellowMax !== undefined && 
                                                           numValue >= yellowMin && numValue <= yellowMax) {
                                                    answerColor = 'yellow';
                                                  } 
                                                  // Tjek derefter rød (range ligesom gul)
                                                  else if (redMin !== undefined && redMax !== undefined && 
                                                           numValue >= redMin && numValue <= redMax) {
                                                    answerColor = 'red';
                                                  }
                                                }
                                              }
                                              
                                              // Fjern kolon fra spørgsmålstekst hvis den allerede slutter med kolon (for at undgå dobbelt kolon)
                                              const displayQuestionText = questionText.trim().endsWith(':') 
                                                ? questionText.trim() 
                                                : `${questionText}:`;
                                              
                                              return (
                                                <div 
                                                  key={questionId} 
                                                  className={`answer-item ${answerColor ? getColorClass(answerColor) : ''}`}
                                                >
                                                  <strong>{displayQuestionText}</strong> {displayAnswer}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorUserOverview;
