import React from 'react';
import { useLocation } from "react-router-dom";
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Typography, Container, Button, Paper, Box, FormControl, Chip, Tooltip, TextField, CircularProgress, Grid } from "@material-ui/core";
import { Accordion, AccordionSummary, AccordionDetails, Popper, ClickAwayListener, Checkbox, FormControlLabel, FormHelperText } from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import DownloadJsonIcon from '@material-ui/icons/GetApp';
import SettingsIcon from '@material-ui/icons/Settings';
import PassIcon from '@material-ui/icons/CheckCircle';
import FailIcon from '@material-ui/icons/Error';
// import EvaluationIcon from '@material-ui/icons/Send';
// import EvaluationIcon from '@material-ui/icons/PlaylistAddCheck';
import EvaluationIcon from '@material-ui/icons/NetworkCheck';

import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import hljs from 'highlight.js/lib/core';
// import hljs from 'highlight.js'; // Too heavy, loading only required languages
import 'highlight.js/styles/github-dark-dimmed.css';
import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', json);
hljs.registerLanguage("pythonlogging",function(e){return {
  // Define codeblock highlight for FUJI API tests logs ouput 
  // purple: title https://highlightjs.readthedocs.io/en/latest/css-classes-reference.html
  aliases: ['pythonlogging'],
  contains: [
    {className: 'deletion', variants: [{ begin: '^ERROR', end: ':' }]},
    {className: 'built_in', variants: [{ begin: '^WARNING', end: ':' }]},
    {className: 'string', variants: [{ begin: '^INFO', end: ':' }]},
    {className: 'addition', variants: [{ begin: '^SUCCESS', end: ':' }]},
    {className: 'strong', variants: [
        { begin: '^WARNING', end: ':' },
        { begin: '^ERROR', end: ':' },
        { begin: '^SUCCESS', end: ':' },
    ]}
  ]
}});

const useStyles = makeStyles(theme => ({
  link: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    // color: 'inherit',
    '&:hover': {
      color: theme.palette.primary.light,
      textDecoration: 'none',
    },
  },
  submitButton: {
    textTransform: 'none',
    margin: theme.spacing(2, 2),
  },
  fullWidth: {
    width: '100%',
  },
  autocomplete: {
    marginRight: theme.spacing(2)
  },
  formInput: {
    background: 'white',
    width: '100%'
  },
  paperPadding: {
    padding: theme.spacing(2, 2),
    margin: theme.spacing(2, 2),
  },
}))

export default function Evaluation() {
  const classes = useStyles();
  const theme = useTheme();
  // useLocation hook to get URL params
  let location = useLocation();  
  let evaluationResults: any = null;
  let resourceMetadata: any = null;
  let fairDoughnutConfig: any = null;
  const [state, setState] = React.useState({
    fujiApi: 'https://fuji-137-120-31-148.sslip.io/fuji/api/v1',
    urlToEvaluate: "https://doi.org/10.1594/PANGAEA.908011",
    // urlToEvaluate: "https://doi.org/10.1038/sdata.2016.18",
    metadata_service_type: 'oai_pmh',
    metadata_service_endpoint: 'https://ws.pangaea.de/oai/provider',
    use_datacite: true,
    evaluationResults: evaluationResults,
    resourceMetadata: resourceMetadata,
    evaluationRunning: false,
    fairDoughnutConfig: fairDoughnutConfig
  });
  const stateRef = React.useRef(state);
  // Avoid conflict when async calls
  const updateState = React.useCallback((update) => {
    stateRef.current = {...stateRef.current, ...update};
    setState(stateRef.current);
  }, [setState]);

  // Settings for Popper
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl]: any = React.useState(null);
  const handleClick = (event: any) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    // setAnchorEl(anchorEl ? null : document.body);
    setOpen((prev) => !prev);
  };
  const handleClickAway = () => {
    setOpen(false);
    setAnchorEl(anchorEl ? null : anchorEl);
  };
  const id = open ? 'simple-popper' : undefined;
  

  // Run on page init
  React.useEffect(() => {
    // Get the edit URL param if provided
    const params = new URLSearchParams(location.search + location.hash);
    let urlToEvaluate = params.get('evaluate');
    if (process.env.FUJI_API) {
      updateState({ fujiApi: process.env.FUJI_API })
    }
    if (urlToEvaluate) {
      updateState({ urlToEvaluate: urlToEvaluate })
      doEvaluateUrl(urlToEvaluate)
    }
  }, [])
  // }, [state.fujiApi, state.evaluationRunning])

  const colors: any = {
    f: '#81d4fa', // blue
    a: '#ffcc80', // orange
    i: '#a5d6a7', // green
    r: '#b39ddb', // purple
    fail: '#ef5350' // red
  }
  const colorsLight: any = {
    Findable: '#b3e5fc', // blue
    Accessible: '#ffe0b2', // orange
    Interoperable: '#c8e6c9', // green
    Reusable: '#d1c4e9', // purple
  }

  const getUrlHtml = (urlString: string) => {
    if(/^(?:node[0-9]+)|((https?|ftp):.*)$/.test(urlString)) {
      // Process URIs
      return <a href={urlString} className={classes.link} target="_blank" rel="noopener noreferrer">{urlString}</a>
    } else {
      return urlString
    }
  }

  const doEvaluateUrl  = (evaluateUrl: string) => {
    updateState({
      evaluationRunning: true,
      evaluationResults: null
    })
    console.log('Starting evaluation of ' + evaluateUrl + ' with FUJI API ' + state.fujiApi)
    const postJson = JSON.stringify({
      "object_identifier": evaluateUrl,
      "metadata_service_endpoint": state.metadata_service_endpoint,
      "metadata_service_type": state.metadata_service_type,
      "use_datacite": state.use_datacite,
      "test_debug": true
    });
    axios.post(state.fujiApi + '/evaluate', postJson, {
      headers: {'Content-Type': 'application/json'}
    })
      .then(res => {
        const evaluationResults = res.data
        updateState({
          evaluationResults: evaluationResults,
          evaluationRunning: false,
          fairDoughnutConfig: buildCharts(evaluationResults)
        })
        console.log(evaluationResults);
        // Check for metadata found in output (core metadata, license)
        let resourceMetadata = {}
        evaluationResults.results.map((item: any, key: number) => {
          if (item.output.core_metadata_found) {
            resourceMetadata = {...resourceMetadata, ...item.output.core_metadata_found}
          }
          if (Array.isArray(item.output)) {
            item.output.map((outputEntry: any, key: number) => {
              if (outputEntry.license) {
                resourceMetadata = {...resourceMetadata, ...{license: outputEntry.license}}  
              }
            })
          }
        })
        updateState({resourceMetadata: resourceMetadata})
        hljs.highlightAll();
      })
  }

  const buildCharts  = (evaluationResults: any) => {
    const scores = evaluationResults['summary']['score_percent']
    const config = {
      type: 'doughnut',
      data: {
        datasets: [
        // Outer doughnut data starts
        {
          data: [ 25, 25, 25, 25 ],
          backgroundColor: [colors.a, colors.i, colors.r, colors.f],
          label: 'FAIR principles',
          labels: [
            scores.A + "% Accessible 📬️",
            scores.I + "% Interoperable ⚙️",
            scores.R + "% Reusable ♻️",
            scores.F + "% Findable 🔍️"
          ]
        },
        // Outer doughnut data ends, inner doughnut data starts
        {
          data: [
            25,
            12.5, 12.5,
            6.25, 6.25, 6.25, 6.25,
            6.25, 6.25, 6.25, 6.25,
          ],
          backgroundColor: [
            colorsLight['Accessible'],
            colorsLight['Interoperable'], colorsLight['Interoperable'],
            colorsLight['Reusable'], colorsLight['Reusable'], colorsLight['Reusable'], colorsLight['Reusable'],
            colorsLight['Findable'], colorsLight['Findable'], colorsLight['Findable'], colorsLight['Findable'],
          ],
          label: 'Score to subcategories',
          labels: [
            scores.A1 + '%'+ " Standard protocol",
            scores.I1 + '%' + " Knowledge representation",
            scores.I3 + '%' + " Model linked to data",
            scores.R1 + '%' + " Content described",
            scores['R1.1'] + '%' + " License",
            scores['R1.2'] + '%'+ " Provenance",
            scores['R1.3'] + '%' + " Community standard",
            scores.F1 + '%'+ " Persistent identifier",
            scores.F2 + '%'+ " Findability metadata",
            scores.F3 + '%'+ " Data identifier",
            scores.F4 + '%'+ " Programmatic retrieval",
          ]
        }
        // Inner doughnut data ends
        ],
        labels: [ "Accessible", "Interoperable", "Reusable", "Findable" ]
      },
      options: {
        responsive: true,
        legend: { position: 'top', display: true },
        animation: { animateScale: true, animateRotate: true },
        tooltips: {
          // callbacks: {
          //   label: function(item, data) {
          //       console.log(data.datasets[item.datasetIndex])
          //       return data.datasets[item.datasetIndex].label+ ": "+ data.labels[item.index]+ ": "+ data.datasets[item.datasetIndex].data[item.index];
          //   }
          // }
          callbacks: {
            label: function(tooltipItem: any, data: any) {
              var dataset = data.datasets[tooltipItem.datasetIndex];
              var index = tooltipItem.index;
              return dataset.labels[index];
            }
          }
        },
        plugins: {
          datalabels: {
            color: 'black',
            formatter: function(value: any, context: any) {
              if (context.datasetIndex == 0) {
                context.font = "bold 20em Montserrat";
                return context.dataset.labels[context.dataIndex];
              } else {
                return context.dataset.labels[context.dataIndex];
              }
            }
          }
        }
      }
    };
    return config;
  }

  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Set the TextField input to the state variable corresponding to the field id  
    updateState({[event.target.id]: event.target.value})
  }
  const handleSubmit  = (event: React.FormEvent) => {
    event.preventDefault();
    doEvaluateUrl(state.urlToEvaluate)
  }
  const downloadEvaluation  = (event: React.FormEvent) => {
    event.preventDefault();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.evaluationResults, null, 4)));
    element.setAttribute('download', 'evaluation.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const getBadgeTestStatus  = (status: string) => {
    if (status == 'pass') {
      return <PassIcon color='secondary' fontSize='large'/>
    } else if (status == 'fail') {
      return <FailIcon style={{color: colors.fail}} fontSize='large'/>
    }
    return <Chip label={status} color='primary'/>
  }
  const getBadgeMaturity  = (maturity: number) => {
    if (maturity == 3) {
      return <Chip label={maturity + '/3'} color='primary'/> // blue
    } else if (maturity == 2) {
      return <Chip label={maturity + '/3'} style={{backgroundColor: colors.r}}/> // purple
    } else if (maturity == 1) {
      return <Chip label={maturity + '/3'} style={{backgroundColor: colors.a}}/> // orange
    } else if (maturity == 0) {
      return <Chip label={maturity + '/3'} style={{backgroundColor: colors.fail}}/> // red
    }
    return <Chip label={maturity + '/3'}/>
  }

  const getResultsForCategory  = (category: string) => {
    const categoryMap: any = {
      'Findable': 'FsF-F',
      'Accessible': 'FsF-A',
      'Interoperable': 'FsF-I',
      'Reusable': 'FsF-R'
    }
    const emojiMap: any = {
      'Findable': '🔍️',
      'Accessible': '📬️',
      'Interoperable': '⚙️',
      'Reusable': '♻️'
    }
    const charCategory = category.substring(0, 1);
    const fairScore = state.evaluationResults['summary']['score_percent'][charCategory]

    return <Accordion key={category} defaultExpanded={fairScore < 100}
        style={{backgroundColor: colorsLight[category]}}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h4">
         {emojiMap[category]} {fairScore}% {category}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={1} style={{textAlign: 'left'}}>
        {
          // Iterate over the evaluation results to show the different metrics tests, output and debug log
          state.evaluationResults.results
            .filter((item: any) => {
              return item.metric_identifier.startsWith(categoryMap[category])
            })
            .map((item: any, key: number) => (
              <Grid item xs={12} md={12} key={key}>
                <Accordion key={key}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {getBadgeTestStatus(item.test_status)}&nbsp;
                    {getBadgeMaturity(item.maturity)}&nbsp;
                    <Typography variant="h6">
                      {item.metric_name}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1} style={{textAlign: 'left'}}>
                      <Grid item xs={12} md={12}>
                        <Typography variant="h6">
                          Tests results:
                        </Typography>
                      </Grid>
                      {
                        Object.keys(item.metric_tests).map((metricTest: any, testKey: number) => {
                          // Iterate over metrics tests (in each result)
                          // {console.log(metricTest, testKey, item.metric_tests[metricTest].metric_test_name);}
                          return <Grid item xs={12} md={12} key={testKey}>
                            <Accordion >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}
                                // aria-controls="panel2-content" id="panel2-header"
                              >
                                {getBadgeTestStatus(item.metric_tests[metricTest].metric_test_status)}&nbsp;
                                <Typography variant="body1">
                                  {item.metric_tests[metricTest].metric_test_name}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography>
                                  Test score: {item.metric_tests[metricTest].metric_test_score}
                                </Typography>
                              </AccordionDetails>
                            </Accordion>
                          </Grid>
                        })
                      }
                      <Grid item xs={12} md={12}>
                        <Typography variant="h6" style={{marginTop: theme.spacing(1)}}>
                          Tests output:
                        </Typography>
                        <pre>
                          <code className="language-json" style={{whiteSpace: 'pre', overflowX: 'auto'}}>
                            {JSON.stringify(item.output, null, 2)}
                          </code>
                        </pre>
                      </Grid>
                      <Grid item xs={12} md={12}>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">
                              Tests logs
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <pre>
                              <code className="language-pythonlogging" style={{whiteSpace: 'pre-wrap', overflowX: 'auto'}}>
                                {item.test_debug.join("\n")}
                              </code>
                            </pre>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))
        }
        </Grid>
      </AccordionDetails>
    </Accordion>
  }

  const skipMetadataArray = ['title', 'summary']

  return(
    <Container className='mainContainer'>
      <Typography variant="h4" style={{textAlign: 'center', marginBottom: theme.spacing(4)}}>
        ⚖️ Evaluate how FAIR is a resource 🔗
      </Typography>

      {/* Form to provide the URL to evaludate */}
      <form onSubmit={handleSubmit}>
        <Box display="flex" style={{margin: theme.spacing(0, 6)}}>
          <TextField
            id='urlToEvaluate'
            label='URL of the resource to evaluate'
            placeholder='URL of the resource to evaluate'
            value={state.urlToEvaluate}
            className={classes.fullWidth}
            variant="outlined"
            onChange={handleTextFieldChange}
            // size='small'
            InputProps={{
              className: classes.formInput
            }}
          />

          <Tooltip  title='Evaluator settings'>
            <Button style={{margin: theme.spacing(1)}} onClick={handleClick}>
              <SettingsIcon />
            </Button>
          </Tooltip>
          <Popper open={open} anchorEl={anchorEl}>
            <ClickAwayListener onClickAway={handleClickAway}>
              <Paper elevation={4} className={classes.paperPadding} style={{textAlign: 'center'}}>
                {/* <Typography variant="h6" style={{textAlign: 'center'}}>
                  Evaluator settings
                </Typography> */}
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Tooltip title='By default, the F-UJI evaluator uses content negociation based on the DOI URL to retrieve DataCite JSON metadata. If you uncheck this option F-UJI will try to use the landing page URL instead.'>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={state.use_datacite}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                              updateState({[event.target.name]: event.target.checked});
                            }}
                            name="use_datacite"
                            color="primary"
                          />
                        }
                        label="Use DataCite"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12}>
                    <Tooltip title='OAI-PMH (Open Archives Initiative Protocol for Metadata Harvesting) endpoint to use when searching for metadata about this resource.'>
                      <TextField
                        id='metadata_service_endpoint'
                        label='OAI-PMH metadata endpoint URL'
                        placeholder='OAI-PMH metadata endpoint URL'
                        value={state.metadata_service_endpoint}
                        className={classes.fullWidth}
                        variant="outlined"
                        onChange={handleTextFieldChange}
                        // size='small'
                        InputProps={{
                          className: classes.formInput
                        }}
                      />
                    </Tooltip>
                    <FormHelperText>List of OAI-PMH providers: {getUrlHtml('https://www.openarchives.org/Register/BrowseSites')}</FormHelperText>
                  </Grid>
                </Grid>
              </Paper>
            </ClickAwayListener>
          </Popper>
        </Box>

        <Button type="submit" 
          variant="contained" 
          className={classes.submitButton} 
          startIcon={<EvaluationIcon />}
          color="secondary" >
            Start the FAIR evaluation
        </Button>
      </form>

      {state.evaluationResults &&
        // Display results from the JSON from the API
        <>
          {state.resourceMetadata &&
            // Display resources metadata if found
            <>
              <Typography variant="h4" style={{margin: theme.spacing(3, 0), textAlign: 'center'}}>Metadata found</Typography>
              <Paper className={classes.paperPadding} style={{textAlign: 'left'}}>
                {state.resourceMetadata.title &&
                  <Typography variant="h5" style={{marginBottom: theme.spacing(1)}}>
                    <b>title</b>: {state.resourceMetadata.title}
                  </Typography>
                }
                {state.resourceMetadata.summary &&
                  <Typography variant="body1" style={{marginBottom: theme.spacing(1)}}>
                    <b>summary</b>: {state.resourceMetadata.summary}
                  </Typography>
                }
                {
                  Object.keys(state.resourceMetadata).map((metadata: any, key: number) => {
                    if (!skipMetadataArray.includes(metadata)) {
                      return <Typography variant="body1" style={{marginBottom: theme.spacing(1)}} key={key}>
                          <b>{metadata}</b>: {getUrlHtml(state.resourceMetadata[metadata])}
                        </Typography>
                    }
                  })
                }
              </Paper>
            </>
          }

          <Typography variant="h4" style={{margin: theme.spacing(3, 0)}}>Evaluation results summary</Typography>
          <Paper className={classes.paperPadding}>
            <Doughnut data={state.fairDoughnutConfig['data']} 
              options={state.fairDoughnutConfig['options']}
              plugins={[
                ChartDataLabels,
                {
                  beforeDraw: function(chart: any) {
                    var width = chart.chart.width,
                        height = chart.chart.height,
                        ctx = chart.chart.ctx;
                    ctx.restore();
                    var fontSize = (height / 114).toFixed(2);
                    ctx.font = fontSize + "em sans-serif";
                    ctx.textBaseline = "middle";
                    var text = Math.round(state.evaluationResults.summary.score_percent.FAIR) + "%",
                        textX = Math.round((width - ctx.measureText(text).width) / 2),
                        textY = height / 2;
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                  }
                }
              ]}
            />
          </Paper>

          <Typography variant="h4" style={{margin: theme.spacing(3, 0)}}>
            Detailed tests results
          </Typography>
          {getResultsForCategory('Findable')}
          {getResultsForCategory('Accessible')}
          {getResultsForCategory('Interoperable')}
          {getResultsForCategory('Reusable')}
          
          <Button
            variant="contained" 
            className={classes.submitButton} 
            onClick={downloadEvaluation}
            startIcon={<DownloadJsonIcon />}>
              Download the evaluation results JSON file
          </Button>
        </>
      }

      {state.evaluationRunning && 
        <CircularProgress style={{marginTop: theme.spacing(5)}} />
      }
    </Container>
  )
}

