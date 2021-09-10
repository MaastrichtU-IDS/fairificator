import React from 'react';
import { useLocation } from "react-router-dom";
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Typography, Container, Button, Paper, FormControl, Snackbar, TextField, CircularProgress, Tooltip } from "@material-ui/core";
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import DownloadJsonIcon from '@material-ui/icons/GetApp';
import EvaluationIcon from '@material-ui/icons/FastForward';
import UploadTriplestoreIcon from '@material-ui/icons/Share';
import ShaclIcon from '@material-ui/icons/AssignmentTurnedIn';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
// import ChartLabels from 'chartjs-plugin-labels';

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
  settingsForm: {
    width: '80%',
    // textAlign: 'center',
    '& .MuiFormControl-root': {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    '& .MuiFormHelperText-root': {
      marginTop: theme.spacing(0),
      marginBottom: theme.spacing(1),
    },
  },
  submitButton: {
    textTransform: 'none',
    margin: theme.spacing(2, 2),
  },
  addEntryButton: {
    textTransform: 'none',
    marginLeft: theme.spacing(2),
    // marginTop: theme.spacing(2),
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
  smallerFont: {
    fontSize: '12px',
  },
  alignLeft: {
    textAlign: 'left'
  },
  paperPadding: {
    padding: theme.spacing(2, 2),
    margin: theme.spacing(2, 2),
  },
  paperTitle: {
    fontWeight: 300,
    marginBottom: theme.spacing(1),
  }
}))

export default function Evaluation() {
  const classes = useStyles();
  const theme = useTheme();
  // useLocation hook to get URL params
  let location = useLocation();  
  let evaluationResults: any = null;
  let fairDoughnutConfig: any = null;
  const [state, setState] = React.useState({
    open: false,
    dialogOpen: false,
    // wizard_jsonld: wizard_jsonld,
    csvwColumnsArray: [],
    jsonld_uri_provided: null,
    edit_enabled: true,
    ontoload_error_open: false,
    ontoload_success_open: false,
    fujiApi: "",
    evaluationResults: evaluationResults,
    urlToEvaluate: "https://doi.org/10.1594/PANGAEA.908011",
    evaluationRunning: false,
    fairDoughnutConfig: fairDoughnutConfig
  });
  const stateRef = React.useRef(state);
  // Avoid conflict when async calls
  const updateState = React.useCallback((update) => {
    stateRef.current = {...stateRef.current, ...update};
    setState(stateRef.current);
  }, [setState]);
  
  // Original form and output:
  // Questions: https://github.com/kodymoodley/fair-metadata-generator/blob/main/questions.csv
  // Full output: https://github.com/kodymoodley/fair-metadata-html-page-generator/blob/main/testdata/inputdata/test.jsonld

  React.useEffect(() => {
    // Get the edit URL param if provided, and download ontology if @context changed
    // Ontology is stored in state.ontology_jsonld 
    // and passed to renderObjectForm to resolve classes and properties
    const params = new URLSearchParams(location.search + location.hash);
    let evaluateUrl = params.get('evaluate');
    // const fujiApi = process.env['FUJI_API'] || 'http://fuji.137.120.31.148.nip.io/fuji/api/v1'
    const fujiApi = process.env['FUJI_API'] || 'https://fuji-137-120-31-148.sslip.io/fuji/api/v1'
    updateState({ fujiApi: fujiApi })
    // const fujiApi = process.env['FUJI_API'] || 'http://localhost:1071/fuji/api/v1/evaluate'

    // axios.get(shacl_url)
    //   .then(res => {
    //     updateState( { shaclString: res.data } )
    //   })
    // updateState({ shacl_url: shacl_url })
    
    // let editionEnabled = params.get('toysrus');
    // if (editionEnabled === 'closed') {
    //   // Disable edit if toysrus=closed
    //   updateState({ edit_enabled: false })
    // }
    if (evaluateUrl) {
      doEvaluateUrl(evaluateUrl)
    }
    
  }, [state.fujiApi, state.evaluationRunning])

  const doEvaluateUrl  = (evaluateUrl: string) => {
    updateState({
      evaluationRunning: true
    })
    // console.log('eval:')
    // console.log(state.evaluationRunning);
    console.log('Starting evaluation of ' + evaluateUrl + ' with FUJI API ' + state.fujiApi)
    // evaluateUrl = "https://doi.org/10.1594/PANGAEA.908011"
    const postJson = JSON.stringify({
      "metadata_service_endpoint": evaluateUrl,
      "metadata_service_type": "oai_pmh",
      "object_identifier": evaluateUrl,
      "test_debug": true,
      "use_datacite": true
    });
    // const res = await axios.post(state.fujiApi, postJson);
    axios.post(state.fujiApi + '/evaluate', postJson, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        updateState({
          evaluationResults: res.data,
          evaluationRunning: false,
          fairDoughnutConfig: buildCharts(res.data)
        })
        console.log(res.data);
      })
    // return res
  }

  const buildCharts  = (evaluationResults: any) => {
    const scores = evaluationResults['summary']['score_percent']
    const config = {
      type: 'doughnut',
      data: {
        datasets: [
        /* Outer doughnut data starts*/
        {
          data: [
            25,
            25,
            25,
            25
          ],
          backgroundColor: [
            "#ffcc80", // orange
            "#a5d6a7", // green
            "#b39ddb", // purple
            "#81d4fa", // blue
          ],
          label: 'FAIR principles',
          labels: [
            "Accessible: " + scores.A,
            "Interoperable: " + scores.I,
            "Reusable: " + scores.R,
            "Findable: " + scores.F
          ]
          // font = "bold 20em Montserrat"
        },
        /* Outer doughnut data ends*/
        /* Inner doughnut data starts*/
        {
          data: [
            25,
            12.5,
            12.5,
            6.25,
            6.25,
            6.25,
            6.25,
            6.25,
            6.25,
            6.25,
            6.25,
          ],
          backgroundColor: [
            "#ffe0b2",
            "#c8e6c9",
            "#c8e6c9",
            "#d1c4e9",
            "#d1c4e9",
            "#d1c4e9",
            "#d1c4e9",
            "#b3e5fc",
            "#b3e5fc",
            "#b3e5fc",
            "#b3e5fc",
          ],
          label: 'Score to subcategories',
          labels: [
            "A1 standardized protocol: " + scores.A1,
            "I1 knowledge representation: " + scores.I1,
            "I2 linked with data: " + scores.I3,
            "R1 content described: " + scores.R1,
            "R1.1 license: " + scores['R1.1'],
            "R1.2 provenance: " + scores['R1.2'],
            "R1.3 community standard: " + scores['R1.3'],
            "F1 persistent identifier: " + scores.F1,
            "F2 core findability metadata: " + scores.F2,
            "F3 data identifier: " + scores.F3,
            "F4 programmatic retrieval: " + scores.F4,
          ]
        }
        /* Inner doughnut data ends*/
        ],
        labels: [
          "Accessible",
          "Interoperable",
          "Reusable",
          "Findable"
        ]
      },
      options: {
        responsive: true,
        legend: {
          position: 'top',
          display: true
        },
        // title: {
        //   display: true,
        //   text: 'Evaluation results summary'
        // },
        animation: {
          animateScale: true,
          animateRotate: true
        },
        tooltips: {
          // callbacks: {
          //   label: function(item, data) {
          //       // console.log(data.labels, item);
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
              formatter: function(value: any, context: any) {
                // console.log('Data labels');
                // console.log(value, context);
                if (context.datasetIndex == 0) {
                  context.font = "bold 20em Montserrat";
                  return context.dataset.labels[context.dataIndex];
                } else {
                  return context.dataset.labels[context.dataIndex];
                }
                // return context.chart.data.labels[context.dataIndex];
              }
          }
        }
        // plugins: {
        //   datalabels: {
        //     display: true,
        //     color: 'black'
        //   }
        // }
      }
    };
    return config;
    // updateState({
    //   fairDoughnutConfig: buildCharts(res.data)
    // })
  }

  // const toJSONLD = (data: any, uri: any) => {
  //   // Convert RDF to JSON-LD using rdflib
  //   let rdf_format = 'application/rdf+xml';
  //   if (uri.endsWith('.ttl')) rdf_format = 'text/turtle'
  //   if (uri.endsWith('.nq')) rdf_format = 'application/n-quads'
  //   // Or text/x-nquads
  //   if (uri.endsWith('.nt')) rdf_format = 'application/n-triples'
  //   if (uri.endsWith('.n3')) rdf_format = 'text/n3'
  //   if (uri.endsWith('.trig')) rdf_format = 'application/trig'
  //   return new Promise((resolve, reject) => {
  //       let store = $rdf.graph()
  //       let doc = $rdf.sym(uri);
  //       $rdf.parse(data, store, uri, rdf_format)
  //       // console.log(store)
  //       $rdf.serialize(doc, store, uri, 'application/ld+json', (err: any, jsonldData: any) => {
  //         return resolve(JSON.parse(jsonldData)
  //           .sort((a: any, b: any) => {
  //             if (a['@type'] && b['@type'] && Array.isArray(a['@type']) && Array.isArray(b['@type'])){
  //               // Handle when array of types provided (e.g. SIO via rdflib)
  //               return a['@type'][0] < b['@type'][0] ? 1 : -1
  //             } else {
  //               return a['@type'] < b['@type'] ? 1 : -1
  //             }
  //           })
  //       )
  //     })
  //   })
  // }

  const handleSubmit  = (event: React.FormEvent) => {
    event.preventDefault();
    doEvaluateUrl(state.urlToEvaluate)
    // updateState({
    //   evaluationRunning: true
    // })
    // var element = document.createElement('a');
    // element.setAttribute('href', 'data:text/turtle;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.wizard_jsonld, null, 4)));
    // element.setAttribute('download', 'metadata.json');
    // element.style.display = 'none';
    // document.body.appendChild(element);
    // element.click();
    // document.body.removeChild(element);
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
    setState({...state, open: true})
  }

  // Close Snackbars
  const closeOntoloadError = () => {
    updateState({...state, ontoload_error_open: false})
  };
  const closeOntoloadSuccess = () => {
    updateState({...state, ontoload_success_open: false})
  };

  // Handle TextField changes for SPARQL endpoint upload
  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // updateState({urlToEvaluate: event.target.value})
    updateState({[event.target.id]: event.target.value})
  }

  // const parseTurtle = (text: string, format: string) => {
  //   const turtleParser = new Parser({ format: format });
  //   const store = new Store();
  //   turtleParser.parse(text).forEach((quad: any) => {
  //       store.addQuad(quad);
  //   });
  //   return store
  // }


  return(
    <Container className='mainContainer'>
      <Typography variant="h4" style={{textAlign: 'center', marginBottom: theme.spacing(4)}}>
        ⚖️ Evaluate how FAIR is a resource ☑️
      </Typography>

{/* 
      <Typography variant="body1" style={{textAlign: 'center', marginBottom: theme.spacing(1)}}>
        Load and edit <a href="https://json-ld.org/" className={classes.link} target="_blank" rel="noopener noreferrer">JSON-LD</a> <a href="https://en.wikipedia.org/wiki/Resource_Description_Framework" className={classes.link} target="_blank" rel="noopener noreferrer">RDF</a> files in a user-friendly web interface, with autocomplete based on the classes and properties of the ontology magically loaded from <code>@context</code> ✨️
      </Typography> */}

      {/* Display the JSON-LD file uploader (if no ?edit= URL param provided) */}
      {/* {!state.jsonld_uri_provided &&
        <JsonldUploader renderObject={state.wizard_jsonld} 
          onChange={(wizard_jsonld: any) => {updateState({wizard_jsonld})}} />
      } */}

      {/* <CsvUploader 
        csvwColumnsArray={state.csvwColumnsArray}
        onChange={(csvwColumnsArray: any) => {updateState({csvwColumnsArray})}} 
      /> */}

      {/* <Snackbar open={state.ontoload_error_open} onClose={closeOntoloadError} autoHideDuration={10000}>
        <MuiAlert elevation={6} variant="filled" severity="error">
          The ontology provided in @context could not be loaded from {state.wizard_jsonld['@context']}
        </MuiAlert>
      </Snackbar>
      <Snackbar open={state.ontoload_success_open} onClose={closeOntoloadSuccess} autoHideDuration={10000}>
        <MuiAlert elevation={6} variant="filled" severity="success">
          The ontology {state.wizard_jsonld['@context']} from @context has been loaded successfully, it will be used for classes and properties autocomplete
        </MuiAlert>
      </Snackbar> */}

      <form onSubmit={handleSubmit}>
        <FormControl className={classes.settingsForm}>

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

          <Button type="submit" 
            variant="contained" 
            className={classes.submitButton} 
            startIcon={<EvaluationIcon />}
            color="secondary" >
              Run the FAIR evaluation
          </Button>

        </FormControl>
      </form>

      {state.evaluationResults &&
        <>
          {/* <Typography variant="body1" style={{textAlign: 'center', marginBottom: theme.spacing(1)}}>
            Global FAIR score: {state.evaluationResults.summary.score_percent.FAIR}%
          </Typography>  */}

          <Paper style={{padding: theme.spacing(2, 2)}}>
            <Typography variant="h6" style={{marginBottom: theme.spacing(1)}}>Evaluation results summary</Typography>
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

          <Button
            variant="contained" 
            className={classes.submitButton} 
            onClick={downloadEvaluation}
            startIcon={<DownloadJsonIcon />}>
              Download the evaluation results as JSON
          </Button>
        </>
      }

      {state.evaluationRunning && 
        <CircularProgress style={{marginTop: theme.spacing(5)}} />
      }

{/* summary: Object { maturity: {…}, score_earned: {…}, score_percent: {…}, … }
maturity: Object { A: 3, A1: 3, F: 3, … }
score_earned: Object { A: 3, A1: 3, F: 7, … }
score_percent: Object { A: 100, A1: 100, F: 100, … }", "
A: 100", "
A1: 100", "
F: 100", "
F1: 100", "
F2: 100", "
F3: 100", "
F4: 100", "
FAIR: 91.67 */}

    </Container>
  )
}

