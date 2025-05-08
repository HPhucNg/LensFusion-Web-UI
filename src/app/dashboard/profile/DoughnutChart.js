"use client";

import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, Title, Tooltip, Legend, DoughnutController, ArcElement } from 'chart.js';
import { categoriesData } from './Category';

// Custom plugin for empty doughnut
const emptyDoughnutPlugin = {
  id: 'emptyDoughnut',
  afterDraw(chart, options) {
    const { datasets } = chart.data;
    
    let hasData = false;
    for (const dataset of datasets) {
      if (dataset.data.some(value => value > 0)) {
        hasData = true;
        break;
      }
    }
    
    // Draw empty circle if no data
    if (!hasData) {
      const { ctx, chartArea } = chart;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;
      
      const color = options.color || 'rgba(220, 220, 220, 0.6)';
      const width = options.width || 2;
      const radiusDecrease = options.radiusDecrease || 0;
      
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.arc(centerX, centerY, radius - radiusDecrease, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }
};

ChartJS.register(Title, Tooltip, Legend, DoughnutController, ArcElement, emptyDoughnutPlugin);

const DoughnutChart = ({ hoveredCategory = null, activeCategory = -1, categories = categoriesData }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const chartCategories = Array.isArray(categories) && categories.length > 0 ? categories : categoriesData;

    const labels = chartCategories.map(category => category.name);
    const counts = chartCategories.map(category => category.count);
    const colors = chartCategories.map(category => category.hoverColor);
    
    // Add transparency to non hovered category
    const backgroundColors = [...colors];
    
    if (hoveredCategory !== null && hoveredCategory >= 0) {
      backgroundColors.forEach((color, i) => {
        if (i !== hoveredCategory) {
          backgroundColors[i] = color + '60';
        }
      });
    }
    else if (activeCategory >= 0) {
      backgroundColors.forEach((color, i) => {
        if (i !== activeCategory) {
          backgroundColors[i] = color + '60';
        }
      });
    }

    // Doughnut chart
    chartRef.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: "Images",
          data: counts,
          backgroundColor: backgroundColors,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '50%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                const value = context.raw || 0;
                return `${value} images`;
              }
            }
          },
          emptyDoughnut: {
            color: 'rgba(220, 220, 220, 0.6)',
            width: 2,
            radiusDecrease: 5
          }
        }
      },
      plugins: [emptyDoughnutPlugin]
    });
    
    return () => {
       if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [hoveredCategory,activeCategory,categories]);

  return (
    <div className="w-full max-w-[120px] h-[120px] mx-auto flex items-center justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default DoughnutChart;