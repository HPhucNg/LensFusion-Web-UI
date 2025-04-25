"use client";

import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, Title, Tooltip, Legend, DoughnutController, ArcElement } from 'chart.js';
import { categoriesData } from './Category';

ChartJS.register(Title, Tooltip, Legend, DoughnutController, ArcElement);

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
          }
        }
      }
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