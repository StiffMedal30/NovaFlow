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
    borderRadius: "6px",
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
  textLink:{
    textDecoration: "none",
    fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
    color: theme.colors.text,
    fontSize: 14,
  },
  button1: {
    width: "100%", 
    padding: "0.75rem", 
    borderRadius: 8, 
    background: theme.colors.accent, 
    color: theme.colors.background, 
    fontWeight: 600, 
    border: "none", 
    cursor: "pointer", 
    boxSizing: "border-box" as const
  },
    textInput: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    boxSizing: "border-box" as const,
    fontSize: 16,
    fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
    color: theme.colors.text,
    background: theme.colors.background,
  },
});

export default GlobalStyles;