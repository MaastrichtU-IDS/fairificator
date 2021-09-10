import React from "react";
import { View } from "react-native";
import { Router, Route } from "./react-router";
import { createTheme, MuiThemeProvider } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import './App.css';
import NavBar from "./src/components/NavBar";
import Footer from "./src/components/Footer";
import Evaluation from "./src/pages/Evaluation";
import About from "./src/pages/About";

// Change theme color and typography here
const theme = createTheme({
  palette: {
    primary: { light: '#63a4ff', main: blue[700], dark: '#004ba0' },
    // secondary: { light: '#ff7043', main: '#ff5722', dark: '#087f23' },
    // Green:
    secondary: { light: '#4caf50', main: '#087f23', dark: '#00600f' },
    // primary: { light: blue[50], main: blue[600], dark: blue[900] },
    // red: { light: '#f05545', main: '#b71c1c', dark: '#7f0000' },
    // default: { light: '#fafafa', main: '#eceff1', dark: grey[600] }
  },
  typography: {
    "fontFamily": "\"Open Sans\", \"Roboto\", \"Arial\"",
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500,
    "fontSize": 11
  },
});

const App = () => (
  <MuiThemeProvider theme={theme}>
    <Router basename="/allthingsfair/">
      <View style={{height: '100%', backgroundColor: '#eceff1'}}>
        <NavBar />

        <Route exact path="/" component={Evaluation} />
        <Route path="/about" component={About} />
        <Footer />
      </View>
    </Router>
  </MuiThemeProvider>
);
export default App;
