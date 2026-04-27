import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Pressable, Alert, ScrollView, TouchableOpacity, Animated, Switch, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font'; 
const getBrightness = (hex) => {
  if (!hex || hex.length !== 7) return 128; 
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
};

const hexToHSL = (hex) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
};

const sortColorsPalette = (colors, direction) => {
  return [...colors].sort((a, b) => {
    const hslA = hexToHSL(a);
    const hslB = hexToHSL(b);
    const isGreyA = hslA.s < 0.15 || hslA.l < 0.1 || hslA.l > 0.95;
    const isGreyB = hslB.s < 0.15 || hslB.l < 0.1 || hslB.l > 0.95;
    if (isGreyA && !isGreyB) return -1; 
    if (!isGreyA && isGreyB) return 1;
    if (isGreyA && isGreyB) {
      return direction === 'lightToDark' ? hslB.l - hslA.l : hslA.l - hslB.l;
    }
    const hueBucketA = Math.floor(hslA.h / 30);
    const hueBucketB = Math.floor(hslB.h / 30);
    if (hueBucketA !== hueBucketB) return hueBucketA - hueBucketB;
    return direction === 'lightToDark' ? hslB.l - hslA.l : hslA.l - hslB.l;
  });
};

const getFontFamily = (val) => {
  if (!val || val === 'normal') return Platform.OS === 'ios' ? 'Menlo' : 'monospace';
  return val;
};

const getGlowStyle = (shape, size, color) => {
  let base = {
    position: 'absolute',
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  };

  switch (shape) {
    case 'square': return { ...base, width: size, height: size, backgroundColor: color };
    case 'rectangle': return { ...base, width: size * 1.3, height: size * 0.7, backgroundColor: color };
    case 'oval': return { ...base, width: size * 1.3, height: size * 0.7, borderRadius: size, backgroundColor: color };
    case 'blood': return { ...base, width: size * 1.2, height: size * 0.8, borderRadius: size, backgroundColor: color };
    case 'pyramid': return {
        ...base, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
        borderLeftWidth: size / 1.8, borderRightWidth: size / 1.8, borderBottomWidth: size * 1.1,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
      };
    case 'circle':
    default: return { ...base, width: size, height: size, borderRadius: size / 2, backgroundColor: color };
  }
};

const availableFonts = [
  { label: 'Not set (Normal)', value: 'normal' },
  { label: '14 Segment LED', value: '14Segment' },
  { label: 'Alex Brush', value: 'AlexBrush' },
  { label: 'Allura', value: 'Allura' },
  { label: 'Amatic Bold', value: 'AmaticBold' },
  { label: 'Amatic SC', value: 'AmaticSC' },
  { label: 'Digital 7', value: 'Digital7' },
  { label: 'Digital 7 Italic', value: 'Digital7Italic' },
  { label: 'Digital 7 Mono', value: 'Digital7Mono' },
  { label: 'Digital 7 Mono Italic', value: 'Digital7MonoItalic' },
  { label: 'Digital Clock', value: 'DigitalClock' },
  { label: 'Digital Font', value: 'DigitalFont' },
  { label: 'DS DIGI', value: 'DSDIGI' },
  { label: 'DS DIGIB', value: 'DSDIGIB' },
  { label: 'DS DIGII', value: 'DSDIGII' },
  { label: 'DS DIGIT', value: 'DSDIGIT' },
  { label: 'E1234', value: 'E1234' },
  { label: 'E1234 Italic', value: 'E1234Italic' },
  { label: 'Great Vibes', value: 'GreatVibes' },
  { label: 'Kaushan Script', value: 'KaushanScript' },
  { label: 'Pacifico', value: 'Pacifico' },
  { label: 'Radioland', value: 'Radioland' },
  { label: 'Radioland Slim', value: 'RadiolandSlim' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Technology Bold', value: 'TechnologyBold' },
  { label: 'Technology Bold Italic', value: 'TechnologyBoldItalic' },
  { label: 'Technology Italic', value: 'TechnologyItalic' },
];

const availableShapes = [
  { label: 'Circle', value: 'circle' },
  { label: 'Oval', value: 'oval' },
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Square', value: 'square' },
  { label: 'Pyramid', value: 'pyramid' },
  { label: 'Blood Pool (Organic)', value: 'blood' },
];

const bgColors = Array.from(new Set([
  '#000000', '#050505', '#0A0A0A', '#111111', '#151515', '#1A1A1A', '#222222', '#2A2A2A', '#333333', '#3A3A3A', '#444444', '#4D4D4D', 
  '#555555', '#666666', '#777777', '#808080', '#888888', '#999999', '#AAAAAA', '#A9A9A9', '#B3B3B3', '#BBBBBB', '#CCCCCC', '#D3D3D3', 
  '#DCDCDC', '#E0E0E0', '#E6E6E6', '#EEEEEE', '#F2F2F2', '#F8F8FF', '#FAFAFA', '#FFFFFF', '#001122', '#001F3F', '#002B5E', '#003366', 
  '#004080', '#0074D9', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136', '#85144b', '#A31526', '#C71585', 
  '#F012BE', '#B10DC9', '#4B0082', '#F0F8FF', '#FFF0F5', '#FFE4E1', '#E0FFFF', '#FAFAD2', '#2F4F4F', '#191970', '#2E8B57', '#8B0000'
]));

const mainColors = Array.from(new Set([
  '#FFFFFF', '#FDFDFD', '#FAFAFA', '#F2F2F2', '#EEEEEE', '#E6E6E6', '#E0E0E0', '#CCCCCC', '#C0C0C0', '#B3B3B3', '#AAAAAA', '#999999',
  '#888888', '#808080', '#777777', '#666666', '#555555', '#4D4D4D', '#444444', '#333333', '#2A2A2A', '#222222', '#1A1A1A', '#111111', 
  '#0A0A0A', '#000000', '#FF3B30', '#FF4500', '#FF6347', '#FF8C00', '#FF9500', '#FFA500', '#FFCC00', '#FFD700', '#FFFF00', '#ADFF2F', 
  '#7FFF00', '#32CD32', '#4CD964', '#00FF00', '#00FA9A', '#5AC8FA', '#00FFFF', '#00BFFF', '#1E90FF', '#007AFF', '#0000FF', '#00008B', 
  '#5856D6', '#8A2BE2', '#9400D3', '#FF2D55', '#FF00FF', '#FF1493', '#FF69B4', '#DC143C', '#8E8E93', '#C7C7CC', '#D1D1D6', '#E5E5EA',
  '#900C3F', '#C70039', '#FF5733', '#FFC300', '#DAF7A6', '#28B463', '#117A65', '#2980B9', '#8E44AD', '#2C3E50', '#F39C12', '#D35400'
]));

const secondColors = Array.from(new Set([
  '#FF3B30', '#FF4500', '#FF6347', '#FF8C00', '#FF9500', '#FFA500', '#FFCC00', '#FFD700', '#FFFF00', '#ADFF2F', '#7FFF00', '#32CD32', 
  '#4CD964', '#00FF00', '#00FA9A', '#5AC8FA', '#00FFFF', '#00BFFF', '#1E90FF', '#007AFF', '#0000FF', '#5856D6', '#8A2BE2', '#9400D3', 
  '#FF2D55', '#FF00FF', '#FF1493', '#FF69B4', '#DC143C', '#FFFFFF', '#F2F2F2', '#E6E6E6', '#CCCCCC', '#B3B3B3', '#999999', '#808080', 
  '#666666', '#4D4D4D', '#333333', '#1A1A1A', '#000000', '#8E8E93', '#C7C7CC', '#D1D1D6', '#E5E5EA', '#900C3F', '#C70039', '#FF5733'
]));

const digitalColors = Array.from(new Set([
  '#FFFFFF', '#FAFAFA', '#F0F0F0', '#E8E8E8', '#E0E0E0', '#D8D8D8', '#D0D0D0', '#C8C8C8', '#C0C0C0', '#B8B8B8', '#B0B0B0', '#A8A8A8', 
  '#A0A0A0', '#989898', '#909090', '#888888', '#808080', '#787878', '#707070', '#686868', '#606060', '#585858', '#505050', '#484848', 
  '#404040', '#383838', '#303030', '#282828', '#202020', '#181818', '#101010', '#080808', '#000000', '#FF3B30', '#FF4500', '#FF9500', 
  '#FFD700', '#FFFF00', '#ADFF2F', '#32CD32', '#00FF00', '#4CD964', '#00FA9A', '#00FFFF', '#5AC8FA', '#1E90FF', '#007AFF', '#0000FF', 
  '#8A2BE2', '#5856D6', '#FF00FF', '#FF1493', '#FF2D55', '#DC143C', '#C70039', '#900C3F', '#2980B9', '#2C3E50', '#F39C12', '#D35400'
]));

const subtextColors = Array.from(new Set([
  '#FFFFFF', '#FAFAFA', '#F0F0F0', '#E8E8E8', '#E0E0E0', '#D8D8D8', '#D0D0D0', '#C8C8C8', '#C0C0C0', '#B8B8B8', '#B0B0B0', '#A8A8A8', 
  '#A0A0A0', '#989898', '#909090', '#888888', '#808080', '#787878', '#707070', '#686868', '#606060', '#585858', '#505050', '#484848', 
  '#404040', '#383838', '#303030', '#282828', '#202020', '#181818', '#101010', '#080808', '#000000', '#FF3B30', '#FF4500', '#FF9500', 
  '#FFD700', '#FFFF00', '#ADFF2F', '#32CD32', '#00FF00', '#4CD964', '#00FA9A', '#00FFFF', '#5AC8FA', '#1E90FF', '#007AFF', '#0000FF', 
  '#8A2BE2', '#5856D6', '#FF00FF', '#FF1493', '#FF2D55', '#DC143C', '#C70039', '#900C3F', '#2980B9', '#2C3E50', '#F39C12', '#D35400'
]));

const rawGlowColors = Array.from(new Set([
  '#FFFFFF', '#FF0000', '#FF3B30', '#FF4500', '#FF8C00', '#FF9500', '#FFCC00', '#FFFF00', '#ADFF2F', '#32CD32', '#00FF00', '#00FA9A',
  '#00FFFF', '#1E90FF', '#0000FF', '#8A2BE2', '#9400D3', '#FF00FF', '#FF1493', '#DC143C', '#800000', '#8B0000', '#B22222', '#A52A2A',
  '#D2691E', '#FF7F50', '#F08080', '#FA8072', '#E9967A', '#FFA07A', '#FFB6C1', '#FFC0CB', '#DB7093', '#C71585', '#DDA0DD', '#DA70D6',
  '#EE82EE', '#BA55D3', '#9370DB', '#4B0082', '#483D8B', '#6A5ACD', '#7B68EE', '#9932CC', '#0000CD', '#00008B',
  '#000080', '#191970', '#006400', '#008000', '#228B22', '#2E8B57', '#3CB371', '#20B2AA', '#66CDAA', '#8FBC8F', '#4682B4', '#5F9EA0'
]));

const SlidingSeconds = ({ value, textColor, selectedFont }) => {
  const [prev, setPrev] = useState(value);
  const [curr, setCurr] = useState(value);
  const anim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (value !== curr) {
      setPrev(curr); 
      setCurr(value); 
      anim.setValue(-60); 
      Animated.timing(anim, {
        toValue: 0,
        duration: 350, 
        useNativeDriver: true,
      }).start();
    }
  }, [value]);

  return (
    <View style={styles.slidingContainer}>
      <Animated.View style={{ transform: [{ translateY: anim }] }}>
        <Text style={[styles.digitalText, styles.odometerText, { color: textColor, fontFamily: getFontFamily(selectedFont) }]}>{curr}</Text>
        <Text style={[styles.digitalText, styles.odometerText, { color: textColor, fontFamily: getFontFamily(selectedFont) }]}>{prev}</Text>
      </Animated.View>
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    '14Segment': require('./assets/14 Segment LED Regular.ttf'),
    'AlexBrush': require('./assets/AlexBrush-Regular.ttf'),
    'Allura': require('./assets/Allura-Regular.otf'),
    'AmaticBold': require('./assets/Amatic-Bold.ttf'),
    'AmaticSC': require('./assets/AmaticSC-Regular.ttf'),
    'Digital7Italic': require('./assets/digital-7 (italic).ttf'),
    'Digital7MonoItalic': require('./assets/digital-7 (mono italic).ttf'),
    'Digital7Mono': require('./assets/digital-7 (mono).ttf'),
    'Digital7': require('./assets/digital-7.ttf'),
    'DigitalClock': require('./assets/digital-clock.ttf'),
    'DigitalFont': require('./assets/digital-font.ttf'),
    'DSDIGI': require('./assets/DS-DIGI.ttf'),
    'DSDIGIB': require('./assets/DS-DIGIB.ttf'),
    'DSDIGII': require('./assets/DS-DIGII.ttf'),
    'DSDIGIT': require('./assets/DS-DIGIT.ttf'),
    'E1234': require('./assets/E1234.ttf'),
    'E1234Italic': require('./assets/E1234-Italic.ttf'),
    'GreatVibes': require('./assets/GreatVibes-Regular.otf'),
    'KaushanScript': require('./assets/KaushanScript-Regular.otf'),
    'Pacifico': require('./assets/Pacifico.ttf'),
    'Radioland': require('./assets/RADIOLAND.ttf'),
    'RadiolandSlim': require('./assets/RADIOLANDSLIM.ttf'),
    'Technology': require('./assets/Technology.ttf'),
    'TechnologyBold': require('./assets/Technology-Bold.ttf'),
    'TechnologyBoldItalic': require('./assets/Technology-BoldItalic.ttf'),
    'TechnologyItalic': require('./assets/Technology-Italic.ttf'),
  });

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppStateVisible(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const [showDigital, setShowDigital] = useState(false); 
  
  const [showClockNumbers, setShowClockNumbers] = useState(false); 
  const [displayMode, setDisplayMode] = useState('time'); 
  const [allowOneTapReveal, setAllowOneTapReveal] = useState(true); 
  const [selectedFont, setSelectedFont] = useState('normal'); 
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false); 
  const [enableAnimation, setEnableAnimation] = useState(true); 
  const [enablePulseAnimation, setEnablePulseAnimation] = useState(true); 
  
  const [enableGlowFX, setEnableGlowFX] = useState(true);
  const [enableGlitchFX, setEnableGlitchFX] = useState(true);
  const [cinematicShape, setCinematicShape] = useState('circle');
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);
  const [cinematicColor, setCinematicColor] = useState('#FF0000');
  
  const [primarySubtext, setPrimarySubtext] = useState('TIME REMAINING');
  const [statusHint, setStatusHint] = useState('SUBJECT ACTIVE');
  const [statusHint2, setStatusHint2] = useState('HEART SYNC: STABLE');
  const [hintHistory, setHintHistory] = useState([]); 
  
  const defaultPrimaryHints = ['NONE', 'TIME REMAINING', 'DAYS REMAINING'];
  const defaultHints = ['NONE', 'SUBJECT ACTIVE', 'PHASE 2 INITIATED', 'HEART RATE LINKED', 'SYSTEM CALIBRATING'];
  const defaultHints2 = ['NONE', 'HEART SYNC: STABLE', 'HEART SYNC: LOST', 'CONNECTION SEVERED', 'OVERRIDE ACCEPTED'];
  
  const allPrimaryHints = Array.from(new Set([...defaultPrimaryHints, ...hintHistory]));
  const allHints1 = Array.from(new Set([...defaultHints, ...hintHistory]));
  const allHints2 = Array.from(new Set([...defaultHints2, ...hintHistory]));

  const [isPrimaryDropdownOpen, setIsPrimaryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isStatus2DropdownOpen, setIsStatus2DropdownOpen] = useState(false);

  const [daysRemainingInput, setDaysRemainingInput] = useState('1000'); 
  const [hoursRemainingInput, setHoursRemainingInput] = useState('0'); 
  const [minutesRemainingInput, setMinutesRemainingInput] = useState('0'); 
  const [secondsRemainingInput, setSecondsRemainingInput] = useState('0'); 

  const [startDate, setStartDate] = useState(Date.now());
  const [isFrozen, setIsFrozen] = useState(false);
  
  const [frozenHour, setFrozenHour] = useState('12');
  const [frozenMinute, setFrozenMinute] = useState('00');
  const [frozenSecond, setFrozenSecond] = useState('00');
  
  const [bgColor, setBgColor] = useState('#000000');           
  const [hourMinColor, setHourMinColor] = useState('#FFFFFF'); 
  const [secondColor, setSecondColor] = useState('#FF3B30');   
  const [digitalColor, setDigitalColor] = useState('#FFFFFF'); 
  const [subTextColor, setSubTextColor] = useState('#888888'); 

  const [bgSort, setBgSort] = useState('lightToDark');
  const [mainSort, setMainSort] = useState('lightToDark');
  const [secSort, setSecSort] = useState('lightToDark');
  const [digiSort, setDigiSort] = useState('lightToDark'); 
  const [subSort, setSubSort] = useState('lightToDark');   
  const [glowSort, setGlowSort] = useState('lightToDark');   

  const [daysLeft, setDaysLeft] = useState('0');
  const [hoursLeft, setHoursLeft] = useState('0');
  const [minsLeft, setMinsLeft] = useState('00');
  const [secsLeft, setSecsLeft] = useState('00');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const visibilityAnim = useRef(new Animated.Value(0)).current; 
  const loopAnimRef = useRef(null); 
  const flickerAnim = useRef(new Animated.Value(1)).current; 
  const glitchTranslateX = useRef(new Animated.Value(0)).current; 
  const underglowAnim1 = useRef(new Animated.Value(0)).current; 
  const underglowAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedStart = await AsyncStorage.getItem('startDate');
        const savedDays = await AsyncStorage.getItem('daysRemainingInput');
        const savedHours = await AsyncStorage.getItem('hoursRemainingInput');
        const savedMins = await AsyncStorage.getItem('minutesRemainingInput');
        const savedSecs = await AsyncStorage.getItem('secondsRemainingInput');
        const savedFrozen = await AsyncStorage.getItem('isFrozen');
        const savedFH = await AsyncStorage.getItem('frozenHour');
        const savedFM = await AsyncStorage.getItem('frozenMinute');
        const savedFS = await AsyncStorage.getItem('frozenSecond');
        const savedNums = await AsyncStorage.getItem('showClockNumbers');
        const savedDisplayMode = await AsyncStorage.getItem('displayMode');
        const savedAllowOneTap = await AsyncStorage.getItem('allowOneTapReveal'); 
        const savedSelectedFont = await AsyncStorage.getItem('selectedFont');
        const savedEnableAnim = await AsyncStorage.getItem('enableAnimation'); 
        const savedEnablePulse = await AsyncStorage.getItem('enablePulseAnimation'); 
        
        const savedEnableGlow = await AsyncStorage.getItem('enableGlowFX');
        const savedEnableGlitch = await AsyncStorage.getItem('enableGlitchFX');
        const savedCinematicShape = await AsyncStorage.getItem('cinematicShape');
        const savedCinematicColor = await AsyncStorage.getItem('cinematicColor');
        
        const savedPrimarySub = await AsyncStorage.getItem('primarySubtext');
        const savedStatusHint = await AsyncStorage.getItem('statusHint');
        const savedStatusHint2 = await AsyncStorage.getItem('statusHint2');
        const savedHintHistory = await AsyncStorage.getItem('hintHistory');
        
        const savedBg = await AsyncStorage.getItem('bgColor');
        const savedHMC = await AsyncStorage.getItem('hourMinColor');
        const savedSC = await AsyncStorage.getItem('secondColor');
        const savedDigi = await AsyncStorage.getItem('digitalColor');
        const savedSub = await AsyncStorage.getItem('subTextColor');

        if (savedDays) setDaysRemainingInput(savedDays);
        if (savedHours) setHoursRemainingInput(savedHours);
        if (savedMins) setMinutesRemainingInput(savedMins);
        if (savedSecs) setSecondsRemainingInput(savedSecs);
        if (savedStart) setStartDate(parseInt(savedStart));
        if (savedFrozen) setIsFrozen(savedFrozen === 'true');
        if (savedFH) setFrozenHour(savedFH);
        if (savedFM) setFrozenMinute(savedFM);
        if (savedFS) setFrozenSecond(savedFS);
        if (savedNums) setShowClockNumbers(savedNums === 'true');
        if (savedDisplayMode) setDisplayMode(savedDisplayMode);
        if (savedAllowOneTap !== null) setAllowOneTapReveal(savedAllowOneTap === 'true');
        if (savedSelectedFont) setSelectedFont(savedSelectedFont);
        if (savedEnableAnim !== null) setEnableAnimation(savedEnableAnim === 'true'); 
        if (savedEnablePulse !== null) setEnablePulseAnimation(savedEnablePulse === 'true'); 
        
        if (savedEnableGlow !== null) setEnableGlowFX(savedEnableGlow === 'true');
        if (savedEnableGlitch !== null) setEnableGlitchFX(savedEnableGlitch === 'true');
        if (savedCinematicShape) setCinematicShape(savedCinematicShape);
        if (savedCinematicColor) setCinematicColor(savedCinematicColor);
        
        if (savedPrimarySub) setPrimarySubtext(savedPrimarySub);
        if (savedStatusHint) setStatusHint(savedStatusHint);
        if (savedStatusHint2) setStatusHint2(savedStatusHint2);
        if (savedHintHistory) setHintHistory(JSON.parse(savedHintHistory));
        
        if (savedBg) setBgColor(savedBg);
        if (savedHMC) setHourMinColor(savedHMC);
        if (savedSC) setSecondColor(savedSC);
        if (savedDigi) setDigitalColor(savedDigi);
        if (savedSub) setSubTextColor(savedSub);
      } catch (error) {
        console.log("Error loading data", error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());

      if (!isFrozen) {
        const now = Date.now();
        const elapsedMilliseconds = now - startDate;
        
        const daysMs = parseFloat(daysRemainingInput || 0) * 1000 * 60 * 60 * 24;
        const hoursMs = parseFloat(hoursRemainingInput || 0) * 1000 * 60 * 60;
        const minsMs = parseFloat(minutesRemainingInput || 0) * 1000 * 60;
        const secsMs = parseFloat(secondsRemainingInput || 0) * 1000;
        
        const totalAllocatedMs = daysMs + hoursMs + minsMs + secsMs;
        const remainingMs = totalAllocatedMs - elapsedMilliseconds;

        if (remainingMs <= 0) {
          setDaysLeft('0');
          setHoursLeft('0');
          setMinsLeft('00');
          setSecsLeft('00');
        } else {
          const d = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
          setDaysLeft(String(d));

          const h = Math.floor(remainingMs / (1000 * 60 * 60)); 
          const m = Math.floor((remainingMs / (1000 * 60)) % 60);
          const s = Math.floor((remainingMs / 1000) % 60);

          setHoursLeft(String(h));
          setMinsLeft(String(m).padStart(2, '0'));
          setSecsLeft(String(s).padStart(2, '0'));
        }
      }
    }, 1000); 

    return () => clearInterval(interval); 
  }, [startDate, daysRemainingInput, hoursRemainingInput, minutesRemainingInput, secondsRemainingInput, isFrozen]);

  const isTextVisible = displayMode !== 'hidden' && showDigital;

  useEffect(() => {
    if (isTextVisible) {
      if (enablePulseAnimation) {
        Animated.timing(visibilityAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => {
          loopAnimRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(visibilityAnim, { toValue: 0.35, duration: 1500, useNativeDriver: true }),
              Animated.timing(visibilityAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
          );
          loopAnimRef.current.start();
        });
      } else {
        if (loopAnimRef.current) loopAnimRef.current.stop();
        Animated.timing(visibilityAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    } else {
      if (loopAnimRef.current) loopAnimRef.current.stop();
      Animated.timing(visibilityAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
    return () => { if (loopAnimRef.current) loopAnimRef.current.stop(); };
  }, [isTextVisible, enablePulseAnimation, appStateVisible]);

  useEffect(() => {
    let loop1, loop2;
    if (enableGlowFX) {
      loop1 = Animated.loop(
        Animated.sequence([
          Animated.timing(underglowAnim1, { toValue: 1, duration: 3800, useNativeDriver: true }),
          Animated.timing(underglowAnim1, { toValue: 0, duration: 4200, useNativeDriver: true })
        ])
      );
      loop2 = Animated.loop(
        Animated.sequence([
          Animated.timing(underglowAnim2, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(underglowAnim2, { toValue: 0.2, duration: 2900, useNativeDriver: true })
        ])
      );
      loop1.start();
      loop2.start();
    } else {
      underglowAnim1.setValue(0);
      underglowAnim2.setValue(0);
    }
    return () => {
      if (loop1) loop1.stop();
      if (loop2) loop2.stop();
    };
  }, [enableGlowFX, appStateVisible]);

  useEffect(() => {
    let glitchTimeout;
    let isActive = true;
    
    if (!enableGlitchFX) {
      flickerAnim.setValue(1);
      glitchTranslateX.setValue(0);
      return;
    }

    const triggerGlitch = () => {
      if (!isActive) return;
      const nextGlitchTime = Math.random() * 8000 + 3000; 
      glitchTimeout = setTimeout(() => {
        if (!isActive) return;
        Animated.sequence([
          Animated.timing(flickerAnim, { toValue: 0.3, duration: 40, useNativeDriver: true }),
          Animated.timing(flickerAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.timing(flickerAnim, { toValue: 0.6, duration: 30, useNativeDriver: true }),
          Animated.timing(flickerAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        ]).start();

        Animated.sequence([
          Animated.timing(glitchTranslateX, { toValue: 3, duration: 20, useNativeDriver: true }),
          Animated.timing(glitchTranslateX, { toValue: -3, duration: 20, useNativeDriver: true }),
          Animated.timing(glitchTranslateX, { toValue: 0, duration: 20, useNativeDriver: true }),
        ]).start(({ finished }) => {
           if (finished && isActive) triggerGlitch(); 
        }); 
      }, nextGlitchTime);
    };

    triggerGlitch();
    return () => {
      isActive = false;
      clearTimeout(glitchTimeout);
      flickerAnim.stopAnimation();
      glitchTranslateX.stopAnimation();
      flickerAnim.setValue(1);
      glitchTranslateX.setValue(0);
    };
  }, [enableGlitchFX, appStateVisible]);


  const saveSettings = async (restartClock = false) => {
    let newStart = startDate;
    if (restartClock) {
      newStart = Date.now();
      setStartDate(newStart);
    }

    setShowDigital(false); 

    let updatedHistory = [...hintHistory];
    const checkAndSaveHint = (hint) => {
      const trimmed = hint.trim();
      if (trimmed && trimmed !== 'NONE' && !defaultHints.includes(trimmed) && !defaultHints2.includes(trimmed) && !defaultPrimaryHints.includes(trimmed) && !updatedHistory.includes(trimmed)) {
        updatedHistory.unshift(trimmed);
        if (updatedHistory.length > 5) updatedHistory.pop();
      }
    };
    checkAndSaveHint(primarySubtext);
    checkAndSaveHint(statusHint);
    checkAndSaveHint(statusHint2);
    setHintHistory(updatedHistory);

    await AsyncStorage.setItem('hintHistory', JSON.stringify(updatedHistory));
    await AsyncStorage.setItem('daysRemainingInput', daysRemainingInput);
    await AsyncStorage.setItem('hoursRemainingInput', hoursRemainingInput);
    await AsyncStorage.setItem('minutesRemainingInput', minutesRemainingInput);
    await AsyncStorage.setItem('secondsRemainingInput', secondsRemainingInput);
    await AsyncStorage.setItem('startDate', newStart.toString());
    await AsyncStorage.setItem('isFrozen', isFrozen.toString());
    await AsyncStorage.setItem('frozenHour', frozenHour);
    await AsyncStorage.setItem('frozenMinute', frozenMinute);
    await AsyncStorage.setItem('frozenSecond', frozenSecond);
    await AsyncStorage.setItem('showClockNumbers', showClockNumbers.toString());
    await AsyncStorage.setItem('displayMode', displayMode);
    await AsyncStorage.setItem('allowOneTapReveal', allowOneTapReveal.toString()); 
    await AsyncStorage.setItem('selectedFont', selectedFont);
    await AsyncStorage.setItem('enableAnimation', enableAnimation.toString()); 
    await AsyncStorage.setItem('enablePulseAnimation', enablePulseAnimation.toString()); 
    await AsyncStorage.setItem('enableGlowFX', enableGlowFX.toString()); 
    await AsyncStorage.setItem('enableGlitchFX', enableGlitchFX.toString()); 
    await AsyncStorage.setItem('cinematicShape', cinematicShape); 
    await AsyncStorage.setItem('cinematicColor', cinematicColor); 
    
    await AsyncStorage.setItem('primarySubtext', primarySubtext); 
    await AsyncStorage.setItem('statusHint', statusHint); 
    await AsyncStorage.setItem('statusHint2', statusHint2); 
    
    await AsyncStorage.setItem('bgColor', bgColor);
    await AsyncStorage.setItem('hourMinColor', hourMinColor);
    await AsyncStorage.setItem('secondColor', secondColor);
    await AsyncStorage.setItem('digitalColor', digitalColor);
    await AsyncStorage.setItem('subTextColor', subTextColor);

    setShowSettings(false);
    Alert.alert("Saved", restartClock ? "System Override Accepted." : "Configuration Locked.");
  };

  const handleDisplayModeSelect = (mode) => {
    setDisplayMode(mode);
    if (mode === 'hidden') {
      setAllowOneTapReveal(false);
    }
  };

  const handleOneTapToggle = (val) => {
    setAllowOneTapReveal(val);
    if (val === true && displayMode === 'hidden') {
      setDisplayMode('time'); 
    }
  };

  const hours = isFrozen ? parseInt(frozenHour || 0) : currentTime.getHours();
  const minutes = isFrozen ? parseInt(frozenMinute || 0) : currentTime.getMinutes();
  const seconds = isFrozen ? parseInt(frozenSecond || 0) : currentTime.getSeconds();

  const secDegrees = (seconds / 60) * 360;
  const minDegrees = ((minutes + seconds / 60) / 60) * 360;
  const hourDegrees = (((hours % 12) + minutes / 60) / 12) * 360;

  const dialTextColor = getBrightness(bgColor) < 128 ? '#FFFFFF' : '#333333';

  const renderClockNumbers = () => {
    if (!showClockNumbers) return null;
    return Array.from({ length: 12 }).map((_, i) => {
      const number = i === 0 ? 12 : i;
      const angle = (number * 30 * Math.PI) / 180;
      const radius = 145; 
      const x = radius * Math.sin(angle);
      const y = -radius * Math.cos(angle);

      return (
        <View key={number} style={[styles.numberContainer, { transform: [{ translateX: x }, { translateY: y }] }]}>
          <Text style={[styles.clockNumberText, { color: dialTextColor }]}>{number}</Text>
        </View>
      );
    });
  };

  const handleHandColorSelect = (selectedHandColor) => {
    setHourMinColor(selectedHandColor);
    const handBrightness = getBrightness(selectedHandColor);
    const currentBgBrightness = getBrightness(bgColor);
    if (handBrightness > 160 && currentBgBrightness > 160) {
      setBgColor('#000000'); 
    } else if (handBrightness < 90 && currentBgBrightness < 90) {
      setBgColor('#FFFFFF'); 
    }
  };

  const handleBgColorSelect = (selectedBgColor) => {
    setBgColor(selectedBgColor);
    const handBrightness = getBrightness(hourMinColor);
    const newBgBrightness = getBrightness(selectedBgColor);
    if (handBrightness > 160 && newBgBrightness > 160) {
      setHourMinColor('#000000'); 
    } else if (handBrightness < 90 && newBgBrightness < 90) {
      setHourMinColor('#FFFFFF'); 
    }
  };

  const renderColorSection = (title, options, selectedColor, onSelect, sortState, setSortState) => {
    const uniqueOptions = Array.from(new Set(options));
    const sortedOptions = sortColorsPalette(uniqueOptions, sortState);
    return (
      <View style={styles.paletteSection}>
        <View style={styles.paletteHeader}>
          <Text style={styles.label}>{title}</Text>
          <TouchableOpacity onPress={() => setSortState(sortState === 'lightToDark' ? 'darkToLight' : 'lightToDark')} style={styles.sortButton}>
            <Text style={styles.sortButtonText}>
              {sortState === 'lightToDark' ? '⬇ Light to Dark' : '⬆ Dark to Light'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.colorRow}>
          {sortedOptions.map((color, index) => (
            <TouchableOpacity 
              key={`${color}-${index}`}
              onPress={() => onSelect(color)} 
              style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === color && styles.colorSwatchSelected]} 
            />
          ))}
        </View>
      </View>
    );
  };

  const renderGlowLayer = (baseSize, animValue, index, opMin, opMax, scaleMin, scaleMax) => {
    const style = getGlowStyle(cinematicShape, baseSize, cinematicColor);
    let transforms = [{ scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [scaleMin, scaleMax] }) }];
    
    if (cinematicShape === 'blood') {
       const offsets = [
          { tx: 25, ty: -15, rot: '15deg' },
          { tx: -30, ty: 20, rot: '-20deg' },
          { tx: 10, ty: 35, rot: '45deg' },
          { tx: -20, ty: -25, rot: '-10deg' }
       ];
       transforms.push({ translateX: offsets[index].tx });
       transforms.push({ translateY: offsets[index].ty });
       transforms.push({ rotate: offsets[index].rot });
    }

    return (
      <Animated.View style={[style, {
        opacity: animValue.interpolate({ inputRange: [0, 1], outputRange: [opMin, opMax] }),
        transform: transforms
      }]} />
    );
  };

  const hasMainSub = primarySubtext !== 'NONE' && primarySubtext.trim() !== '';
  const hasHint1 = statusHint !== 'NONE' && statusHint.trim() !== '';
  const hasHint2 = statusHint2 !== 'NONE' && statusHint2.trim() !== '';
  
  let clockMargin = 60; 
  if (!hasHint1 && !hasHint2 && !hasMainSub) clockMargin = -30; 
  else if (!hasHint1 && !hasHint2) clockMargin = -10; 
  else if (!hasHint2 || !hasHint1) clockMargin = 25; 

  if (!fontsLoaded) {
    return <View style={styles.container} />; 
  }

  if (showSettings) {
    return (
      <View style={styles.settingsContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Device Config</Text>
          
          <Text style={styles.sectionHeader}>Time & Target</Text>
          <Text style={styles.label}>Set Event Horizon:</Text>
          
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputWrapper}>
              <Text style={styles.label}>Days</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={daysRemainingInput} onChangeText={setDaysRemainingInput} />
            </View>
            <View style={{width: 8}} />
            <View style={styles.timeInputWrapper}>
              <Text style={styles.label}>Hours</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={hoursRemainingInput} onChangeText={setHoursRemainingInput} />
            </View>
            <View style={{width: 8}} />
            <View style={styles.timeInputWrapper}>
              <Text style={styles.label}>Mins</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={minutesRemainingInput} onChangeText={setMinutesRemainingInput} />
            </View>
            <View style={{width: 8}} />
            <View style={styles.timeInputWrapper}>
              <Text style={styles.label}>Secs</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={secondsRemainingInput} onChangeText={setSecondsRemainingInput} />
            </View>
          </View>

          <Text style={styles.dateInfoText}>Clock Started: {new Date(startDate).toLocaleString()}</Text>

          <Text style={[styles.label, {marginTop: 20}]}>Display Mode:</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity style={[styles.segmentButton, displayMode === 'hidden' && styles.segmentActive]} onPress={() => handleDisplayModeSelect('hidden')}>
              <Text style={[styles.segmentText, displayMode === 'hidden' && styles.segmentTextActive]}>Hidden</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, displayMode === 'days' && styles.segmentActive]} onPress={() => handleDisplayModeSelect('days')}>
              <Text style={[styles.segmentText, displayMode === 'days' && styles.segmentTextActive]}>Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, displayMode === 'time' && styles.segmentActive]} onPress={() => handleDisplayModeSelect('time')}>
              <Text style={[styles.segmentText, displayMode === 'time' && styles.segmentTextActive]}>Time</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.frozenContainer}>
            <Text style={styles.label}>Analog Engine Override:</Text>
            <Button title={isFrozen ? "Currently FROZEN (Tap to Unfreeze)" : "Currently RUNNING (Tap to Freeze)"} onPress={() => setIsFrozen(!isFrozen)} color={isFrozen ? "#c0392b" : "#27ae60"} />

            {isFrozen && (
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.label}>Hour (0-24)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={2} value={frozenHour} onChangeText={setFrozenHour} />
                </View>
                <View style={{width: 10}} />
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.label}>Min (0-59)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={2} value={frozenMinute} onChangeText={setFrozenMinute} />
                </View>
                <View style={{width: 10}} />
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.label}>Sec (0-59)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" maxLength={2} value={frozenSecond} onChangeText={setFrozenSecond} />
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>Cinematic & Atmosphere</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Fog Glow FX</Text>
            <Switch value={enableGlowFX} onValueChange={setEnableGlowFX} trackColor={{ true: '#FF3B30' }} />
          </View>

          <Text style={[styles.label, {marginTop: 5}]}>Glow Shape Style:</Text>
          <View style={{zIndex: 3000, marginBottom: 15}}>
            <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsShapeDropdownOpen(!isShapeDropdownOpen)}>
              <Text style={styles.dropdownHeaderText}>
                {availableShapes.find(s => s.value === cinematicShape)?.label || 'Circle'}
              </Text>
              <Text style={{color: '#007AFF', fontWeight: 'bold'}}>{isShapeDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {isShapeDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {availableShapes.map((shape, index) => (
                  <TouchableOpacity 
                    key={shape.value} 
                    style={[styles.dropdownItem, index === availableShapes.length - 1 && {borderBottomWidth: 0}]} 
                    onPress={() => { setCinematicShape(shape.value); setIsShapeDropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{shape.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {renderColorSection(`Glow Color`, rawGlowColors, cinematicColor, setCinematicColor, glowSort, setGlowSort)}

          <View style={[styles.switchRow, {marginTop: 25}]}>
            <Text style={styles.label}>Enable Glitch / Shudder FX</Text>
            <Switch value={enableGlitchFX} onValueChange={setEnableGlitchFX} trackColor={{ true: '#FF3B30' }} />
          </View>

          <Text style={[styles.label, {marginTop: 5}]}>Main Countdown Label:</Text>
          <View style={{zIndex: 2500, marginBottom: 15}}>
            <View style={styles.inputWithDropdownRow}>
              <TextInput 
                style={styles.inputWithDropdownText} 
                value={primarySubtext} 
                onChangeText={setPrimarySubtext} 
                placeholder="Enter custom label or select ▼" 
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.dropdownIconButton} onPress={() => setIsPrimaryDropdownOpen(!isPrimaryDropdownOpen)}>
                <Text style={{color: '#fff', fontSize: 16}}>▼</Text>
              </TouchableOpacity>
            </View>
            {isPrimaryDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {allPrimaryHints.map((hint, idx) => (
                  <TouchableOpacity 
                    key={`main-${idx}`} 
                    style={[styles.dropdownItem, idx === allPrimaryHints.length - 1 && {borderBottomWidth: 0}]} 
                    onPress={() => { setPrimarySubtext(hint); setIsPrimaryDropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Device Status Line 1:</Text>
          <View style={{zIndex: 2000, marginBottom: 15}}>
            <View style={styles.inputWithDropdownRow}>
              <TextInput 
                style={styles.inputWithDropdownText} 
                value={statusHint} 
                onChangeText={setStatusHint} 
                placeholder="Enter custom tag or select ▼" 
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.dropdownIconButton} onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                <Text style={{color: '#fff', fontSize: 16}}>▼</Text>
              </TouchableOpacity>
            </View>
            {isStatusDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {allHints1.map((hint, idx) => (
                  <TouchableOpacity 
                    key={`line1-${idx}`} 
                    style={[styles.dropdownItem, idx === allHints1.length - 1 && {borderBottomWidth: 0}]} 
                    onPress={() => { setStatusHint(hint); setIsStatusDropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Device Status Line 2:</Text>
          <View style={{zIndex: 1500, marginBottom: 15}}>
            <View style={styles.inputWithDropdownRow}>
              <TextInput 
                style={styles.inputWithDropdownText} 
                value={statusHint2} 
                onChangeText={setStatusHint2} 
                placeholder="Enter custom tag or select ▼" 
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.dropdownIconButton} onPress={() => setIsStatus2DropdownOpen(!isStatus2DropdownOpen)}>
                <Text style={{color: '#fff', fontSize: 16}}>▼</Text>
              </TouchableOpacity>
            </View>
            {isStatus2DropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {allHints2.map((hint, idx) => (
                  <TouchableOpacity 
                    key={`line2-${idx}`} 
                    style={[styles.dropdownItem, idx === allHints2.length - 1 && {borderBottomWidth: 0}]} 
                    onPress={() => { setStatusHint2(hint); setIsStatus2DropdownOpen(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>Interface & Visuals</Text>

          <Text style={[styles.label, {marginTop: 5}]}>Digital Font Style:</Text>
          <View style={{zIndex: 1000, marginBottom: 15}}>
            <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsFontDropdownOpen(!isFontDropdownOpen)}>
              <Text style={styles.dropdownHeaderText}>
                {availableFonts.find(f => f.value === selectedFont)?.label || 'Not set (Normal)'}
              </Text>
              <Text style={{color: '#007AFF', fontWeight: 'bold'}}>{isFontDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {isFontDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                <ScrollView nestedScrollEnabled style={{maxHeight: 200}}>
                  {availableFonts.map((font, index) => (
                    <TouchableOpacity 
                      key={font.value} 
                      style={[styles.dropdownItem, index === availableFonts.length - 1 && {borderBottomWidth: 0}]} 
                      onPress={() => { setSelectedFont(font.value); setIsFontDropdownOpen(false); }}
                    >
                      <Text style={[styles.dropdownItemText, {fontFamily: getFontFamily(font.value)}]}>
                        {font.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable 1-Tap Wake Up</Text>
            <Switch value={allowOneTapReveal} onValueChange={handleOneTapToggle} trackColor={{ true: '#007AFF' }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Odometer Animation</Text>
            <Switch value={enableAnimation} onValueChange={setEnableAnimation} trackColor={{ true: '#007AFF' }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Enable Slow Breathing Fade</Text>
            <Switch value={enablePulseAnimation} onValueChange={setEnablePulseAnimation} trackColor={{ true: '#007AFF' }} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show 12-Hour Numbers</Text>
            <Switch value={showClockNumbers} onValueChange={setShowClockNumbers} trackColor={{ true: '#007AFF' }} />
          </View>

          {renderColorSection(`Background Color`, bgColors, bgColor, handleBgColorSelect, bgSort, setBgSort)}
          {renderColorSection(`Hour & Min Hand`, mainColors, hourMinColor, handleHandColorSelect, mainSort, setMainSort)}
          {renderColorSection(`Second Hand`, secondColors, secondColor, setSecondColor, secSort, setSecSort)}
          {renderColorSection(`Digital Numbers`, digitalColors, digitalColor, setDigitalColor, digiSort, setDigiSort)}
          {renderColorSection(`Subtext Label`, subtextColors, subTextColor, setSubTextColor, subSort, setSubSort)}

          <View style={styles.buttonRow}>
            <View style={{ marginBottom: 15 }}>
              <Button title="Apply Configuration (Keep Running)" onPress={() => saveSettings(false)} color="#34C759" />
            </View>
            <Button title="Re-Initialize System" onPress={() => saveSettings(true)} color="#007AFF" />
          </View>

          <View style={{height: 50}} />
        </ScrollView>
      </View>
    );
  }

  const renderDetailed = displayMode === 'time' || (displayMode === 'hidden' && showDigital);

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: bgColor }]}
      onPress={() => { 
        if (allowOneTapReveal && !showDigital && displayMode !== 'hidden') {
          setShowDigital(true);
        }
      }} 
      delayLongPress={5000} 
      onLongPress={() => setShowSettings(true)}
    >
      <Animated.View style={[styles.layoutManager, { opacity: flickerAnim, transform: [{ translateX: glitchTranslateX }] }]}>
        
        <View style={[styles.clockWrapper, { marginTop: clockMargin }]}>
          
          {enableGlowFX && (
            <View pointerEvents="none" style={styles.glowContainer}>
              {renderGlowLayer(400, underglowAnim1, 0, 0.01, 0.04, 0.95, 1.15)}
              {renderGlowLayer(340, underglowAnim1, 1, 0.03, 0.08, 0.9, 1.1)}
              {renderGlowLayer(280, underglowAnim2, 2, 0.05, 0.12, 0.85, 1.05)}
              {renderGlowLayer(220, underglowAnim2, 3, 0.1, 0.2, 0.8, 1.02)}
            </View>
          )}

          <View style={styles.handsContainer}>
            {renderClockNumbers()}
            <View style={[styles.handWrapper, { transform: [{ rotate: `${hourDegrees}deg` }] }]}>
              <View style={[styles.hourHand, { backgroundColor: hourMinColor }]} />
            </View>
            <View style={[styles.handWrapper, { transform: [{ rotate: `${minDegrees}deg` }] }]}>
              <View style={[styles.minuteHand, { backgroundColor: hourMinColor }]} />
            </View>
            <View style={[styles.handWrapper, { transform: [{ rotate: `${secDegrees}deg` }] }]}>
              <View style={[styles.secondHand, { backgroundColor: secondColor }]} />
              <View style={[styles.secondHandTail, { backgroundColor: secondColor }]} />
            </View>
            <View style={[styles.centerCap, { backgroundColor: hourMinColor }]} />
            <View style={[styles.centerCapInner, { backgroundColor: secondColor }]} />
          </View>
        </View>

        <Animated.View style={[styles.digitalContainer, { opacity: visibilityAnim }]}>
          {renderDetailed ? (
            <View style={styles.timeRow}>
              <Text style={[styles.digitalText, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>
                {hoursLeft}<Text style={styles.colon}>:</Text>{minsLeft}<Text style={styles.colon}>:</Text>
              </Text>
              {enableAnimation ? (
                <SlidingSeconds value={secsLeft} textColor={digitalColor} selectedFont={selectedFont} />
              ) : (
                <View style={styles.slidingContainer}>
                  <Text style={[styles.digitalText, styles.odometerText, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>
                    {secsLeft}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.digitalText, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>{daysLeft}</Text>
          )}
          
          {hasMainSub && (
            <Text style={[styles.digitalSub, { color: subTextColor, fontFamily: getFontFamily(selectedFont) }]}>
              {primarySubtext}
            </Text>
          )}

          {hasHint1 && (
            <Text style={[styles.statusHintText, { color: subTextColor, fontFamily: getFontFamily(selectedFont) }]}>
              [ {statusHint} ]
            </Text>
          )}
          {hasHint2 && (
            <Text style={[styles.statusHintText, { color: subTextColor, fontFamily: getFontFamily(selectedFont), marginTop: 6 }]}>
              [ {statusHint2} ]
            </Text>
          )}

        </Animated.View>

      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  layoutManager: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clockWrapper: { justifyContent: 'center', alignItems: 'center' },
  
  glowContainer: { position: 'absolute', width: 400, height: 400, justifyContent: 'center', alignItems: 'center' },

  handsContainer: { width: 340, height: 340, justifyContent: 'center', alignItems: 'center' },
  numberContainer: { position: 'absolute', width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  clockNumberText: { fontSize: 24, fontWeight: '500' }, 
  handWrapper: { position: 'absolute', width: 340, height: 340, alignItems: 'center', justifyContent: 'flex-start' },
  
  hourHand: { width: 6, height: 105, marginTop: 65, borderRadius: 3 }, 
  minuteHand: { width: 4, height: 150, marginTop: 20, borderRadius: 2 },
  secondHand: { width: 2, height: 160, marginTop: 10 },
  secondHandTail: { width: 2, height: 30, position: 'absolute', top: 170 },
  centerCap: { position: 'absolute', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  centerCapInner: { width: 6, height: 6, borderRadius: 3, position: 'absolute' },
  
  digitalContainer: { position: 'absolute', top: '12%', alignItems: 'center' },
  digitalText: { fontSize: 56, letterSpacing: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  colon: { opacity: 0.6, paddingBottom: 5, marginHorizontal: 6 }, 
  slidingContainer: { height: 65, width: 65, overflow: 'hidden', justifyContent: 'flex-start' },
  odometerText: { height: 65, lineHeight: 65, textAlign: 'center' },
  digitalSub: { fontSize: 18, letterSpacing: 4, marginTop: 5 },
  
  statusHintText: {
    fontSize: 14,
    letterSpacing: 6,
    marginTop: 22,
    opacity: 0.35, 
  },
  
  settingsContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 30, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 5 },
  paletteSection: { marginTop: 10, marginBottom: 15 },
  paletteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 4 },
  
  inputWithDropdownRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden' },
  inputWithDropdownText: { flex: 1, padding: 10, fontSize: 14, color: '#333' },
  dropdownIconButton: { backgroundColor: '#8e44ad', paddingHorizontal: 15, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 5 },
  dropdownHeaderText: { fontSize: 16, color: '#333' },
  dropdownListContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 5, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownItemText: { fontSize: 14, color: '#333' },

  segmentedControl: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 8, padding: 4, marginTop: 5, marginBottom: 15 },
  segmentButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  segmentText: { fontSize: 14, color: '#666', fontWeight: '500' },
  segmentTextActive: { color: '#007AFF', fontWeight: 'bold' },

  dateInfoText: { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  sortButton: { backgroundColor: '#e0e0e0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  sortButtonText: { fontSize: 11, fontWeight: '600', color: '#333' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', color: '#000', padding: 8, borderRadius: 8, fontSize: 16 },
  frozenContainer: { marginTop: 15, padding: 15, backgroundColor: '#eaeaea', borderRadius: 10 },
  timeInputRow: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  timeInputWrapper: { flex: 1 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  colorSwatchSelected: { borderColor: '#007AFF', borderWidth: 3, transform: [{ scale: 1.15 }] },
  buttonRow: { marginTop: 30 },
});