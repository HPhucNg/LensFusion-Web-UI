import React, { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/FirebaseConfig';
import { auth } from '@/firebase/FirebaseConfig';

export const categoryMapping = {
  'background-generated': 'Background Generation',
  'background-removed': 'Background Removal',
  'object-retouched': 'Object Retouch',
  'object-removed': 'Object Removal',
  'upscaled': 'Upscale',
  'background-expanded': 'Background Expansion'
};

export const categoriesData = [
  { name: 'Background Generation', hoverColor: '#E6B1B1' },
  { name: 'Background Removal',  hoverColor: '#E6CCB1' },
  { name: 'Object Retouch',  hoverColor: '#E6E0B1' },
  { name: 'Object Removal',  hoverColor: '#B1DBE6' },
  { name: 'Upscale',hoverColor: '#B8B1E6' },
  { name: 'Background Expansion', hoverColor: '#E6B1D8' },
];

export function Category({ hoveredIndex, setHoveredIndex, activeCategory, setActiveCategory, theme: externalTheme, onCategoriesUpdate }) {

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" 
  });
  
  const [categories, setCategories] = useState(categoriesData);
  const [totalCount, setTotalCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchImageCategories = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log("No user logged in");
          setLoading(false);
          return;
        }
        
        const userImagesRef = collection(db, 'user_images');
        const q = query(userImagesRef, where('userID', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const categoryCounts = {
          'Background Generation':0,
          'Background Removal': 0,
          'Object Retouch': 0,
          'Object Removal': 0,
          'Upscale': 0,
          'Background Expansion': 0
        };
        
        let communityCategoryCount = 0;
        
        querySnapshot.forEach((doc) => {
          const imageData = doc.data();
          const type = imageData.type;
          
          // Count images shared to community
          if (imageData.communityPostId || imageData.communityPost) {
            communityCategoryCount++;
          }
          
          if (type && categoryMapping[type]) {
            const categoryName = categoryMapping[type];
            categoryCounts[categoryName]++;
          }
        });
        
        setCommunityCount(communityCategoryCount);
        
        const updatedCategories = categoriesData.map(category => ({
          ...category,
          count: categoryCounts[category.name] || 0
        }));
        
        setCategories(updatedCategories);

        if (onCategoriesUpdate) {
          onCategoriesUpdate(updatedCategories);
        }

        const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
        setTotalCount(total);
      } catch (error) {
        console.error("Error fetching image categories:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImageCategories();
  }, []);
  
  const currentActiveCategory = activeCategory;
  
  // Update color themes based on Light/Dark mode
  useEffect(() => {
    if (externalTheme) {
      setIsDarkMode(externalTheme === "dark");
    }
  }, [externalTheme]);
  

  const theme = {
    dark: {
      button: {
        background: 'transparent',
        text: 'white',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      },
      counter: {
        background: '#464646',
        text: '#CECECE'
      },
      active: {
        background: '#333333',
        text: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }
    },
    light: {
      button: {
        background: '#E5E5E5',
        text: 'black',
      },
      counter: {
        background: '#ffffff',
        text: '#060606'
      },
      active: {
        background: '#D1D1D1',
        text: '#000000',
        border: 'none'
      }
    },
    hover: {
      text: '#141823',
      counter: {
        background: '#FFFFFF',
        text: '#676767'
      }
    },
    total: {
      hoverColor: '#B9EF9B',
      background: isDarkMode ? 'transparent' : '#E5E5E5',
      text: isDarkMode ? 'white' : 'black',
    },
    community: {
      hoverColor: '#72efdd', // Gold/amber color for community - distinct from other categories
      background: isDarkMode ? 'transparent' : '#E5E5E5',
      text: isDarkMode ? 'white' : 'black',
    }
  };
  
  const handleCategoryClick = (index) => {
    const newIndex = currentActiveCategory === index ? -1 : index;
    if (setActiveCategory) {
      setActiveCategory(newIndex);
    }
  };
    
  const getAllImagesBackgroundColor = () => {
    if (currentActiveCategory === -1) return theme.total.hoverColor;
    if (hoveredIndex === -1) return theme.total.hoverColor;
    return isDarkMode ? theme.dark.button.background : theme.light.button.background;
  };

  const getAllImagesTextColor = () => {
    if (currentActiveCategory === -1 || hoveredIndex === -1) return theme.hover.text;
    return isDarkMode ? theme.dark.button.text : theme.light.button.text;
  };

  const getCommunityBackgroundColor = () => {
    if (currentActiveCategory === -2) return theme.community.hoverColor;
    if (hoveredIndex === -2) return theme.community.hoverColor;
    return isDarkMode ? theme.dark.button.background : theme.light.button.background;
  };

  const getCommunityTextColor = () => {
    if (currentActiveCategory === -2 || hoveredIndex === -2) return theme.hover.text;
    return isDarkMode ? theme.dark.button.text : theme.light.button.text;
  };

  const getCategoryStyles = (index, category) => {
    const isHovered = hoveredIndex === index;
    const isActive = currentActiveCategory === index;
    const currentTheme = isDarkMode ? theme.dark : theme.light;
    
    return {
      backgroundColor: isActive || isHovered ? category.hoverColor : currentTheme.button.background,
      color: isActive || isHovered ? theme.hover.text : currentTheme.button.text,
      border: isActive || isHovered ? 'none' : currentTheme.button.border,
      fontWeight: isActive ? 'bold' : 'normal',
      transition: 'all 0.2s ease'
    };
  };

  const getCounterStyles = (index) => {
    const isHovered = hoveredIndex === index;
    const isActive = currentActiveCategory === index; 
    const currentTheme = isDarkMode ? theme.dark : theme.light;
    
    return {
      backgroundColor: isHovered || isActive ? theme.hover.counter.background : currentTheme.counter.background,
      color: isHovered || isActive ? theme.hover.counter.text : currentTheme.counter.text
    };
  };
  
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-gray-400">Categories</h3>
      <div className="flex flex-wrap gap-1 md:grid-cols-1 lg:grid-cols-4">

        <div
          key="total"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-sm"
          style={{
            backgroundColor: getAllImagesBackgroundColor(),
            color: getAllImagesTextColor(),
            transition: 'all 0.2s ease',
            border: currentActiveCategory === -1 ? 'none' : (isDarkMode ? theme.dark.button.border : theme.light.button.border),
            fontWeight: currentActiveCategory === -1 ? 'bold' : 'normal'
          }}
          onMouseEnter={() => setHoveredIndex(-1)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => handleCategoryClick(-1)}
        >
          <span className="font-medium">All Images</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={getCounterStyles(-1)}
          >
            {totalCount}
          </span>
        </div>
        
        {categories.map((category, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm"
            style={getCategoryStyles(index, category)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleCategoryClick(index)}
          >
            <span className="font-medium">{category.name}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={getCounterStyles(index)}
            >
              {category.count}
            </span>
          </div>
        ))}
        
        {/* Community Category - Special case that doesn't affect chart */}
        <div
          key="community"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-sm"
          style={{
            backgroundColor: getCommunityBackgroundColor(),
            color: getCommunityTextColor(),
            transition: 'all 0.2s ease',
            border: currentActiveCategory === -2 ? 'none' : (isDarkMode ? theme.dark.button.border : theme.light.button.border),
            fontWeight: currentActiveCategory === -2 ? 'bold' : 'normal'
          }}
          onMouseEnter={() => setHoveredIndex(-2)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => handleCategoryClick(-2)}
        >
          <span className="font-medium">Community</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={getCounterStyles(-2)}
          >
            {communityCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Category;