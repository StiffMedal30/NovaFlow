import React, { useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import GlobalStyles from "../../app/GlobalStyles";

export function MockAnalytics() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sample data for the line chart
  const lineData = [
    { x: 0, y: 10 },
    { x: 50, y: 25 },
    { x: 100, y: 40 },
    { x: 150, y: 35 },
    { x: 200, y: 60 },
    { x: 250, y: 55 },
    { x: 300, y: 75 },
    { x: 350, y: 70 },
    { x: 400, y: 85 },
    { x: 450, y: 90 },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Clear previous content
    svg.innerHTML = '';

    // Create line chart
    const linePathData = lineData.map((point, index) => {
      const x = margin.left + (point.x / 450) * (width - margin.left - margin.right);
      const y = height - margin.bottom - (point.y / 100) * (height - margin.top - margin.bottom);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', linePathData);
    linePath.setAttribute('stroke', currentTheme.colors.accent);
    linePath.setAttribute('stroke-width', '3');
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');

    // Add gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'lineGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', currentTheme.colors.accent);
    stop1.setAttribute('stop-opacity', '0.8');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', currentTheme.colors.accent);
    stop2.setAttribute('stop-opacity', '0.2');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    linePath.setAttribute('stroke', 'url(#lineGradient)');

    // Add data points
    lineData.forEach((point) => {
      const x = margin.left + (point.x / 450) * (width - margin.left - margin.right);
      const y = height - margin.bottom - (point.y / 100) * (height - margin.top - margin.bottom);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', currentTheme.colors.accent);
      circle.setAttribute('stroke', currentTheme.colors.secondary_background);
      circle.setAttribute('stroke-width', '2');

      svg.appendChild(circle);
    });

    svg.appendChild(linePath);

    // Add axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left.toString());
    xAxis.setAttribute('y1', (height - margin.bottom).toString());
    xAxis.setAttribute('x2', (width - margin.right).toString());
    xAxis.setAttribute('y2', (height - margin.bottom).toString());
    xAxis.setAttribute('stroke', currentTheme.colors.text);
    xAxis.setAttribute('stroke-width', '1');
    xAxis.setAttribute('opacity', '0.3');

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left.toString());
    yAxis.setAttribute('y1', margin.top.toString());
    yAxis.setAttribute('x2', margin.left.toString());
    yAxis.setAttribute('y2', (height - margin.bottom).toString());
    yAxis.setAttribute('stroke', currentTheme.colors.text);
    yAxis.setAttribute('stroke-width', '1');
    yAxis.setAttribute('opacity', '0.3');

    svg.appendChild(xAxis);
    svg.appendChild(yAxis);

    // Add chart title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', margin.left.toString());
    title.setAttribute('y', (margin.top - 5).toString());
    title.setAttribute('font-size', '14');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', currentTheme.colors.text);

    svg.appendChild(title);

  }, [currentTheme]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        background: currentTheme.colors.secondary_background,
        borderRadius: 18,
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        border: `1.5px solid ${currentTheme.colors.border}`,
        padding: "2rem 1.5rem",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "4.5rem",
      }}
    >
      <h2 style={{ ...styles.h2, marginBottom: 12 }}>Analytics</h2>
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="200"
          viewBox="0 0 400 200"
          style={{ overflow: 'visible' }}
        />
      </div>
    </div>
  );
}
