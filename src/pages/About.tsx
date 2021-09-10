import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Container, Typography } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  settingsForm: {
    width: '100%',
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
  saveButton: {
    textTransform: 'none',
    margin: theme.spacing(2, 2),
  },
  fullWidth: {
    width: '100%',
  },
  normalFont: {
    fontSize: '14px',
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


export default function About() {
  const classes = useStyles();
  const [state, setState] = React.useState({
    open: false,
    dialogOpen: false,
    project_license: '',
    language_autocomplete: [],
  });
  // const form_category_dropdown = React.createRef(); 

  return(
    <Container className='mainContainer'>
        {/* <Typography variant="h4" style={{textAlign: 'center', marginBottom: '20px'}}>
          About
        </Typography> */}

      <Typography variant="body1" style={{textAlign: 'center', marginBottom: '20px'}}>
        A UI to evaluate how a resource (URL) follows to the FAIR principles (Findable, Accessible, Interoperable, Reusable)
      </Typography>      
      

    </Container>
  )
}