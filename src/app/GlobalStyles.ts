const GlobalStyles = (theme: any) => ({
  body: {
    margin: 0,
    padding: 0,
  },
  a: { //Normal Text
    textDecoration: "none",
    fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
    color: theme.colors.text,
    fontSize: 16,
  },
  settingsItem:{
    padding: "12px 16px",
    textDecoration: "none",
    fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
    color: theme.colors.text,
    fontSize: 16,
  },
  h1: { //Header Main Title
    textDecoration: "none",
    fontSize: 36,
    fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
    color: theme.colors.text,
  },
  h2: { //Secondary Header
    textDecoration: "none",
    fontSize: 24,
    margin: "0.5rem 0",
    fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
    color: theme.colors.text,
  },
});

export default GlobalStyles;