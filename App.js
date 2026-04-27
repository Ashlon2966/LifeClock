import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Pressable, Alert, ScrollView, TouchableOpacity, Animated, Switch, Platform, AppState, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font'; 
import Slider from '@react-native-community/slider';
import * as NavigationBar from 'expo-navigation-bar';

// 🚀 HARDWARE LIBRARIES
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';

// ==========================================
// 1. HELPERS & MATH
// ==========================================
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 }; 
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length >= 7) {
    r = parseInt(hex[1] + hex[2], 16); g = parseInt(hex[3] + hex[4], 16); b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
};

const rgbToHex = (r, g, b) => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
};

const getBrightness = (hex) => {
  if (!hex || typeof hex !== 'string') return 128; 
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
};

const getFontFamily = (val) => {
  if (!val || val === 'normal') return Platform.OS === 'ios' ? 'Menlo' : 'monospace';
  return val;
};

// ==========================================
// 2. STATIC CONFIGURATIONS (ALL 27 FONTS)
// ==========================================
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

const availableGlowAnimations = [
  { label: '1. Breathing (Default)', value: 'breathe' },
  { label: '2. Melting (Drip)', value: 'melt' },
  { label: '3. Spinning Vortex', value: 'spin' },
  { label: '4. Heartbeat', value: 'heartbeat' },
  { label: '5. Unstable Flicker', value: 'flicker' },
  { label: '6. Radar Sweep', value: 'radar' },
  { label: '7. Ghosting (Wander)', value: 'ghost' },
  { label: '8. Glitch Overload', value: 'glitch' },
  { label: '9. Toxic Sway', value: 'sway' },
  { label: '10. Frozen (Static)', value: 'static' }
];

const defaultPrimaryHints = ['NONE', 'TIME REMAINING', 'DAYS REMAINING'];
const defaultHints = ['NONE', 'SUBJECT ACTIVE', 'PHASE 2 INITIATED', 'HEART RATE LINKED', 'SYSTEM CALIBRATING'];
const defaultHints2 = ['NONE', 'HEART SYNC: STABLE', 'HEART SYNC: LOST', 'CONNECTION SEVERED', 'OVERRIDE ACCEPTED'];

// ==========================================
// 3. CUSTOM COMPONENTS
// ==========================================
const AdvancedColorPicker = ({ label, color, onColorChange }) => {
  const safeColor = color || '#FF0000'; 
  const [rgb, setRgb] = useState(hexToRgb(safeColor));
  const [hexInput, setHexInput] = useState(safeColor);

  useEffect(() => {
    const c = color || '#FF0000';
    setRgb(hexToRgb(c));
    setHexInput(c);
  }, [color]);

  const handleSliderChange = (type, value) => {
    const newRgb = { ...rgb, [type]: Math.round(value) };
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(newHex);
    onColorChange(newHex);
  };

  const handleHexSubmit = (text) => {
    let formatted = text.startsWith('#') ? text : '#' + text;
    setHexInput(formatted);
    if (/^#[0-9A-F]{6}$/i.test(formatted)) {
      setRgb(hexToRgb(formatted));
      onColorChange(formatted.toUpperCase());
    }
  };

  return (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorPickerTitle}>{label}</Text>
      <View style={styles.hexInputRow}>
        <View style={[styles.colorPreviewBubble, { backgroundColor: safeColor }]} />
        <Text style={styles.hexLabel}>HEX:</Text>
        <TextInput style={styles.hexInput} value={hexInput} onChangeText={handleHexSubmit} maxLength={7} autoCapitalize="characters" />
      </View>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, {color: '#FF3B30'}]}>R</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={255} value={rgb.r} onValueChange={(val) => handleSliderChange('r', val)} minimumTrackTintColor="#FF3B30" thumbTintColor="#FF3B30" />
        <Text style={styles.sliderValue}>{rgb.r}</Text>
      </View>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, {color: '#34C759'}]}>G</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={255} value={rgb.g} onValueChange={(val) => handleSliderChange('g', val)} minimumTrackTintColor="#34C759" thumbTintColor="#34C759" />
        <Text style={styles.sliderValue}>{rgb.g}</Text>
      </View>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, {color: '#007AFF'}]}>B</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={255} value={rgb.b} onValueChange={(val) => handleSliderChange('b', val)} minimumTrackTintColor="#007AFF" thumbTintColor="#007AFF" />
        <Text style={styles.sliderValue}>{rgb.b}</Text>
      </View>
    </View>
  );
};

// 🚀 REUSABLE ODOMETER (Now for Hours, Minutes, and Seconds)
const SlidingOdometer = ({ value, textColor, selectedFont }) => {
  const [prev, setPrev] = useState(value);
  const [curr, setCurr] = useState(value);
  const anim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (value !== curr) {
      setPrev(curr); setCurr(value); anim.setValue(-80); 
      Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    }
  }, [value]);

  return (
    <View style={styles.slidingSecondsContainer}>
      <Animated.View style={{ transform: [{ translateY: anim }] }}>
        <Text style={[styles.digitalTextMain, styles.odometerText, { color: textColor, fontFamily: getFontFamily(selectedFont) }]}>{curr}</Text>
        <Text style={[styles.digitalTextMain, styles.odometerText, { color: textColor, fontFamily: getFontFamily(selectedFont) }]}>{prev}</Text>
      </Animated.View>
    </View>
  );
};

// ==========================================
// 4. MAIN APP COMPONENT
// ==========================================
export default function App() {
  // 🚀 HARDWARE: SCREEN ALWAYS ON
  useKeepAwake();

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
    const subscription = AppState.addEventListener('change', nextAppState => setAppStateVisible(nextAppState));
    return () => subscription.remove();
  }, []);

  // IMMERSIVE FULLSCREEN
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, [appStateVisible]);

  // UI STATES
  const [showSettings, setShowSettings] = useState(false);
  const [showDigital, setShowDigital] = useState(false); 
  
  // TIME & TARGET STATES
  const [daysRemainingInput, setDaysRemainingInput] = useState('1000'); 
  const [hoursRemainingInput, setHoursRemainingInput] = useState('0'); 
  const [minutesRemainingInput, setMinutesRemainingInput] = useState('0'); 
  const [secondsRemainingInput, setSecondsRemainingInput] = useState('0'); 
  const [startDate, setStartDate] = useState(Date.now());
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenHour, setFrozenHour] = useState('12');
  const [frozenMinute, setFrozenMinute] = useState('00');
  const [frozenSecond, setFrozenSecond] = useState('00');
  const [displayMode, setDisplayMode] = useState('time'); 

  // CINEMATIC & ATMOSPHERE STATES
  const [enableGlowFX, setEnableGlowFX] = useState(true);
  const [enableGlitchFX, setEnableGlitchFX] = useState(true);
  const [cinematicShape, setCinematicShape] = useState('circle');
  const [glowAnimationType, setGlowAnimationType] = useState('breathe');
  
  // 🚀 GRADIENT STATES
  const [useGradient, setUseGradient] = useState(false);
  const [gradientColor, setGradientColor] = useState('#220000');
  const [gradientType, setGradientType] = useState('linear');

  // LABEL STATES
  const [primarySubtext, setPrimarySubtext] = useState('TIME REMAINING');
  const [statusHint, setStatusHint] = useState('SUBJECT ACTIVE');
  const [statusHint2, setStatusHint2] = useState('HEART SYNC: STABLE');
  const [hintHistory, setHintHistory] = useState([]); 
  const [isPrimaryDropdownOpen, setIsPrimaryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isStatus2DropdownOpen, setIsStatus2DropdownOpen] = useState(false);

  const allPrimaryHints = Array.from(new Set([...defaultPrimaryHints, ...hintHistory]));
  const allHints1 = Array.from(new Set([...defaultHints, ...hintHistory]));
  const allHints2 = Array.from(new Set([...defaultHints2, ...hintHistory]));

  // INTERFACE STATES
  const [selectedFont, setSelectedFont] = useState('Technology'); 
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [allowOneTapReveal, setAllowOneTapReveal] = useState(true); 
  const [enableAnimation, setEnableAnimation] = useState(true); 
  const [showClockNumbers, setShowClockNumbers] = useState(false);

  // COLOR STATES
  const [bgColor, setBgColor] = useState('#000000');           
  const [hourMinColor, setHourMinColor] = useState('#FFFFFF'); 
  const [secondColor, setSecondColor] = useState('#FF3B30');   
  const [digitalColor, setDigitalColor] = useState('#FF4500'); 
  const [subTextColor, setSubTextColor] = useState('#FFFFFF'); 
  const [cinematicColor, setCinematicColor] = useState('#8B0000');

  // LIVE CLOCK STATES
  const [daysLeft, setDaysLeft] = useState('0');
  const [hoursLeft, setHoursLeft] = useState('0');
  const [minsLeft, setMinsLeft] = useState('00');
  const [secsLeft, setSecsLeft] = useState('00');
  const [currentTime, setCurrentTime] = useState(new Date());

  const visibilityAnim = useRef(new Animated.Value(0)).current; 
  const flickerAnim = useRef(new Animated.Value(1)).current; 
  const glitchTranslateX = useRef(new Animated.Value(0)).current; 
  const universalEngineAnim = useRef(new Animated.Value(0)).current; 

  // LOAD SETTINGS
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
        
        const savedEnableGlow = await AsyncStorage.getItem('enableGlowFX');
        const savedEnableGlitch = await AsyncStorage.getItem('enableGlitchFX');
        const savedCinematicShape = await AsyncStorage.getItem('cinematicShape');
        const savedGlowAnim = await AsyncStorage.getItem('glowAnimationType');

        const savedUseGrad = await AsyncStorage.getItem('useGradient');
        const savedGradCol = await AsyncStorage.getItem('gradientColor');
        const savedGradType = await AsyncStorage.getItem('gradientType');
        
        const savedPrimarySub = await AsyncStorage.getItem('primarySubtext');
        const savedStatusHint = await AsyncStorage.getItem('statusHint');
        const savedStatusHint2 = await AsyncStorage.getItem('statusHint2');
        const savedHintHistory = await AsyncStorage.getItem('hintHistory');
        
        const savedBg = await AsyncStorage.getItem('bgColor');
        const savedHMC = await AsyncStorage.getItem('hourMinColor');
        const savedSC = await AsyncStorage.getItem('secondColor');
        const savedDigi = await AsyncStorage.getItem('digitalColor');
        const savedSub = await AsyncStorage.getItem('subTextColor');
        const savedCineCol = await AsyncStorage.getItem('cinematicColor');

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
        
        if (savedEnableGlow !== null) setEnableGlowFX(savedEnableGlow === 'true');
        if (savedEnableGlitch !== null) setEnableGlitchFX(savedEnableGlitch === 'true');
        if (savedCinematicShape) setCinematicShape(savedCinematicShape);
        if (savedGlowAnim) setGlowAnimationType(savedGlowAnim);

        if (savedUseGrad !== null) setUseGradient(savedUseGrad === 'true');
        if (savedGradCol) setGradientColor(savedGradCol);
        if (savedGradType) setGradientType(savedGradType);
        
        if (savedPrimarySub) setPrimarySubtext(savedPrimarySub);
        if (savedStatusHint) setStatusHint(savedStatusHint);
        if (savedStatusHint2) setStatusHint2(savedStatusHint2);
        
        if (savedHintHistory) {
          try { setHintHistory(JSON.parse(savedHintHistory)); } 
          catch (e) { setHintHistory([]); }
        }
        
        if (savedBg) setBgColor(savedBg);
        if (savedHMC) setHourMinColor(savedHMC);
        if (savedSC) setSecondColor(savedSC);
        if (savedDigi) setDigitalColor(savedDigi);
        if (savedSub) setSubTextColor(savedSub);
        if (savedCineCol) setCinematicColor(savedCineCol);
      } catch (error) { console.log(error); }
    };
    loadSettings();
  }, []);

  // TICK ENGINE
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (!isFrozen) {
        const elapsedMilliseconds = Date.now() - startDate;
        const totalAllocatedMs = (parseFloat(daysRemainingInput || 0) * 86400000) + (parseFloat(hoursRemainingInput || 0) * 3600000) + (parseFloat(minutesRemainingInput || 0) * 60000) + (parseFloat(secondsRemainingInput || 0) * 1000);
        const remainingMs = totalAllocatedMs - elapsedMilliseconds;

        if (remainingMs <= 0) {
          setDaysLeft('0'); setHoursLeft('00'); setMinsLeft('00'); setSecsLeft('00');
        } else {
          setDaysLeft(String(Math.floor(remainingMs / 86400000)));
          setHoursLeft(String(Math.floor(remainingMs / 3600000)).padStart(2, '0'));
          setMinsLeft(String(Math.floor((remainingMs / 60000) % 60)).padStart(2, '0'));
          setSecsLeft(String(Math.floor((remainingMs / 1000) % 60)).padStart(2, '0'));
        }
      }
    }, 1000); 
    return () => clearInterval(interval); 
  }, [startDate, daysRemainingInput, hoursRemainingInput, minutesRemainingInput, secondsRemainingInput, isFrozen]);

  const isTextVisible = displayMode !== 'hidden' && showDigital;

  // VISIBILITY ENGINE (Instant Fade)
  useEffect(() => {
    Animated.timing(visibilityAnim, { toValue: isTextVisible ? 1 : 0, duration: 500, useNativeDriver: true }).start();
  }, [isTextVisible]);

  // GLOW ENGINE
  useEffect(() => {
    const engineLoop = Animated.loop(Animated.timing(universalEngineAnim, { toValue: 1, duration: 4000, useNativeDriver: true }));
    if (enableGlowFX) engineLoop.start(); else { engineLoop.stop(); universalEngineAnim.setValue(0); }
    return () => engineLoop.stop();
  }, [enableGlowFX, appStateVisible]);

  // GLITCH ENGINE
  useEffect(() => {
    let glitchTimeout; let isActive = true;
    if (!enableGlitchFX) { flickerAnim.setValue(1); glitchTranslateX.setValue(0); return; }

    const triggerGlitch = () => {
      if (!isActive) return;
      glitchTimeout = setTimeout(() => {
        if (!isActive) return;
        Animated.sequence([
          Animated.timing(flickerAnim, { toValue: 0.3, duration: 40, useNativeDriver: true }),
          Animated.timing(flickerAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.timing(glitchTranslateX, { toValue: 5, duration: 20, useNativeDriver: true }),
          Animated.timing(glitchTranslateX, { toValue: -5, duration: 20, useNativeDriver: true }),
          Animated.timing(glitchTranslateX, { toValue: 0, duration: 20, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished && isActive) triggerGlitch(); }); 
      }, Math.random() * 8000 + 3000);
    };

    triggerGlitch();
    return () => { isActive = false; clearTimeout(glitchTimeout); flickerAnim.setValue(1); glitchTranslateX.setValue(0); };
  }, [enableGlitchFX, appStateVisible]);

  // SAVE SETTINGS
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

    const settingsBatch = [
      ['hintHistory', JSON.stringify(updatedHistory)],
      ['daysRemainingInput', daysRemainingInput],
      ['hoursRemainingInput', hoursRemainingInput],
      ['minutesRemainingInput', minutesRemainingInput],
      ['secondsRemainingInput', secondsRemainingInput],
      ['startDate', newStart.toString()],
      ['isFrozen', isFrozen.toString()],
      ['frozenHour', frozenHour],
      ['frozenMinute', frozenMinute],
      ['frozenSecond', frozenSecond],
      ['showClockNumbers', showClockNumbers.toString()],
      ['displayMode', displayMode],
      ['allowOneTapReveal', allowOneTapReveal.toString()],
      ['selectedFont', selectedFont],
      ['enableAnimation', enableAnimation.toString()],
      ['enableGlowFX', enableGlowFX.toString()],
      ['enableGlitchFX', enableGlitchFX.toString()],
      ['cinematicShape', cinematicShape],
      ['glowAnimationType', glowAnimationType],
      ['useGradient', useGradient.toString()],
      ['gradientColor', gradientColor],
      ['gradientType', gradientType],
      ['primarySubtext', primarySubtext],
      ['statusHint', statusHint],
      ['statusHint2', statusHint2],
      ['bgColor', bgColor],
      ['hourMinColor', hourMinColor],
      ['secondColor', secondColor],
      ['digitalColor', digitalColor],
      ['subTextColor', subTextColor],
      ['cinematicColor', cinematicColor]
    ];
    await AsyncStorage.multiSet(settingsBatch);
    setShowSettings(false);
  };

  const handleDisplayModeSelect = (mode) => {
    setDisplayMode(mode);
    if (mode === 'hidden') setAllowOneTapReveal(false);
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

  const renderGlowLayer = (baseSize, index) => {
    let base = { position: 'absolute', shadowColor: cinematicColor, shadowOpacity: 0.8, shadowRadius: 30, elevation: 10, backgroundColor: cinematicColor };
    
    switch (cinematicShape) {
      case 'square': base = { ...base, width: baseSize, height: baseSize }; break;
      case 'rectangle': base = { ...base, width: baseSize * 1.3, height: baseSize * 0.7 }; break;
      case 'oval': base = { ...base, width: baseSize * 1.3, height: baseSize * 0.7, borderRadius: baseSize }; break;
      case 'blood': base = { ...base, width: baseSize * 1.2, height: baseSize * 0.8, borderRadius: baseSize }; break;
      case 'circle': default: base = { ...base, width: baseSize, height: baseSize, borderRadius: baseSize / 2 }; break;
    }

    let transforms = [];
    let layerOpacity = 0.15 - (index * 0.03); 
    const animPhase = universalEngineAnim;

    if (cinematicShape === 'blood') {
       const offsets = [{ tx: 25, ty: -15, rot: '15deg' }, { tx: -30, ty: 20, rot: '-20deg' }, { tx: 10, ty: 35, rot: '45deg' }, { tx: -20, ty: -25, rot: '-10deg' }];
       transforms.push({ translateX: offsets[index].tx }, { translateY: offsets[index].ty }, { rotate: offsets[index].rot });
    }

    switch(glowAnimationType) {
      case 'melt':
        transforms.push({ translateY: animPhase.interpolate({ inputRange: [0, 1], outputRange: [0, 80 + (index*20)] }) });
        transforms.push({ scaleY: animPhase.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) });
        transforms.push({ scaleX: animPhase.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) });
        layerOpacity = animPhase.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.15, 0.15, 0] });
        break;
      case 'spin':
        transforms.push({ rotate: animPhase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) });
        transforms.push({ scale: 1.1 });
        break;
      case 'heartbeat':
        transforms.push({ scale: animPhase.interpolate({ inputRange: [0, 0.1, 0.2, 0.3, 1], outputRange: [1, 1.15, 1, 1.15, 1] }) });
        break;
      case 'radar':
        transforms.push({ scale: animPhase.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.5] }) });
        layerOpacity = animPhase.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.2, 0.05, 0] });
        break;
      case 'sway':
        transforms.push({ translateX: animPhase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-20, 20, -20] }) });
        break;
      case 'ghost':
        transforms.push({ translateY: animPhase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] }) });
        layerOpacity = animPhase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.2, 0.05] });
        break;
      case 'breathe':
      default:
        transforms.push({ scale: animPhase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.95, 1.1, 0.95] }) });
        layerOpacity = animPhase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.15, 0.05] });
        break;
      case 'static':
        transforms.push({ scale: 1.05 });
        break;
    }

    return <Animated.View style={[base, { opacity: layerOpacity, transform: transforms }]} />;
  };

  const renderDetailed = displayMode === 'time' || (displayMode === 'hidden' && showDigital);
  if (!fontsLoaded) return <View style={styles.container} />; 

  if (showSettings) {
    return (
      <View style={styles.settingsContainer}>
        <StatusBar hidden={false} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Director Config</Text>
          
          <Text style={styles.sectionHeader}>Time & Target</Text>
          <Text style={styles.label}>Set Event Horizon:</Text>
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputWrapper}><Text style={styles.label}>Days</Text><TextInput style={styles.input} keyboardType="numeric" value={daysRemainingInput} onChangeText={setDaysRemainingInput} /></View>
            <View style={{width: 8}} />
            <View style={styles.timeInputWrapper}><Text style={styles.label}>Hours</Text><TextInput style={styles.input} keyboardType="numeric" value={hoursRemainingInput} onChangeText={setHoursRemainingInput} /></View>
            <View style={{width: 8}} />
            <View style={styles.timeInputWrapper}><Text style={styles.label}>Mins</Text><TextInput style={styles.input} keyboardType="numeric" value={minutesRemainingInput} onChangeText={setMinutesRemainingInput} /></View>
            <View style={{width: 8}} />
            <View style={styles.timeInputWrapper}><Text style={styles.label}>Secs</Text><TextInput style={styles.input} keyboardType="numeric" value={secondsRemainingInput} onChangeText={setSecondsRemainingInput} /></View>
          </View>
          
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
            <Button title={isFrozen ? "Currently FROZEN" : "Currently RUNNING"} onPress={() => setIsFrozen(!isFrozen)} color={isFrozen ? "#c0392b" : "#27ae60"} />
            {isFrozen && (
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputWrapper}><TextInput style={styles.input} keyboardType="numeric" value={frozenHour} onChangeText={setFrozenHour} placeholder="HH" /></View>
                <View style={styles.timeInputWrapper}><TextInput style={styles.input} keyboardType="numeric" value={frozenMinute} onChangeText={setFrozenMinute} placeholder="MM" /></View>
                <View style={styles.timeInputWrapper}><TextInput style={styles.input} keyboardType="numeric" value={frozenSecond} onChangeText={setFrozenSecond} placeholder="SS" /></View>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>Cinematic Atmosphere</Text>
          <View style={styles.switchRow}><Text style={styles.label}>Keep Screen Permanently Awake</Text><Switch value={true} disabled trackColor={{ true: '#007AFF' }} /></View>
          <View style={styles.switchRow}><Text style={styles.label}>Enable Formatted Glitch FX</Text><Switch value={enableGlitchFX} onValueChange={setEnableGlitchFX} trackColor={{ true: '#FF3B30' }} /></View>
          <View style={styles.switchRow}><Text style={styles.label}>Enable Backlight Glow</Text><Switch value={enableGlowFX} onValueChange={setEnableGlowFX} trackColor={{ true: '#FF3B30' }} /></View>
          
          <View style={styles.switchRow}><Text style={styles.label}>Enable Cinematic BG Gradient</Text><Switch value={useGradient} onValueChange={setUseGradient} trackColor={{ true: '#007AFF' }} /></View>
          {useGradient && (
            <View style={{marginBottom: 20}}>
              <AdvancedColorPicker label="Gradient End Color" color={gradientColor} onColorChange={setGradientColor} />
              <Text style={styles.label}>Gradient Style:</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity style={[styles.segmentButton, gradientType === 'linear' && styles.segmentActive]} onPress={() => setGradientType('linear')}><Text style={[styles.segmentText, gradientType === 'linear' && styles.segmentTextActive]}>Vertical</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.segmentButton, gradientType === 'circular' && styles.segmentActive]} onPress={() => setGradientType('circular')}><Text style={[styles.segmentText, gradientType === 'circular' && styles.segmentTextActive]}>Spotlight</Text></TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.label, {marginTop: 5}]}>Glow Shape Style:</Text>
          <View style={{marginBottom: 15}}>
            {availableShapes.map((s) => (
              <TouchableOpacity key={s.value} onPress={() => setCinematicShape(s.value)} style={[styles.optionBtn, cinematicShape === s.value && styles.optionBtnActive]}>
                <Text style={[styles.optionText, cinematicShape === s.value && styles.optionTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, {marginTop: 5}]}>Glow Animation Engine:</Text>
          <View style={{marginBottom: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
            {availableGlowAnimations.map((s) => (
              <TouchableOpacity key={s.value} onPress={() => setGlowAnimationType(s.value)} style={[styles.chipBtn, glowAnimationType === s.value && styles.chipBtnActive]}>
                <Text style={[styles.chipText, glowAnimationType === s.value && styles.chipTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, {marginTop: 5}]}>Main Countdown Label:</Text>
          <View style={{zIndex: 2500, marginBottom: 15}}>
            <View style={styles.inputWithDropdownRow}>
              <TextInput style={styles.inputWithDropdownText} value={primarySubtext} onChangeText={setPrimarySubtext} />
              <TouchableOpacity style={styles.dropdownIconButton} onPress={() => setIsPrimaryDropdownOpen(!isPrimaryDropdownOpen)}><Text style={{color: '#fff', fontSize: 16}}>▼</Text></TouchableOpacity>
            </View>
            {isPrimaryDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {allPrimaryHints.map((hint, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => { setPrimarySubtext(hint); setIsPrimaryDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>{hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Device Status Line 1:</Text>
          <View style={{zIndex: 2000, marginBottom: 15}}>
            <View style={styles.inputWithDropdownRow}>
              <TextInput style={styles.inputWithDropdownText} value={statusHint} onChangeText={setStatusHint} />
              <TouchableOpacity style={styles.dropdownIconButton} onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}><Text style={{color: '#fff', fontSize: 16}}>▼</Text></TouchableOpacity>
            </View>
            {isStatusDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {allHints1.map((hint, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => { setStatusHint(hint); setIsStatusDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>{hint}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Device Status Line 2:</Text>
          <View style={{zIndex: 1500, marginBottom: 15}}>
            <View style={styles.inputWithDropdownRow}>
              <TextInput style={styles.inputWithDropdownText} value={statusHint2} onChangeText={setStatusHint2} />
              <TouchableOpacity style={styles.dropdownIconButton} onPress={() => setIsStatus2DropdownOpen(!isStatus2DropdownOpen)}><Text style={{color: '#fff', fontSize: 16}}>▼</Text></TouchableOpacity>
            </View>
            {isStatus2DropdownOpen && (
              <View style={styles.dropdownListContainer}>
                {allHints2.map((hint, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownItem} onPress={() => { setStatusHint2(hint); setIsStatus2DropdownOpen(false); }}>
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
              <Text style={styles.dropdownHeaderText}>{availableFonts.find(f => f.value === selectedFont)?.label || 'normal'}</Text>
              <Text style={{color: '#007AFF'}}>▼</Text>
            </TouchableOpacity>
            {isFontDropdownOpen && (
              <View style={styles.dropdownListContainer}>
                <ScrollView nestedScrollEnabled style={{maxHeight: 200}}>
                  {availableFonts.map((font) => (
                    <TouchableOpacity key={font.value} style={styles.dropdownItem} onPress={() => { setSelectedFont(font.value); setIsFontDropdownOpen(false); }}>
                      <Text style={[styles.dropdownItemText, {fontFamily: getFontFamily(font.value)}]}>{font.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          
          <View style={styles.switchRow}><Text style={styles.label}>Enable 1-Tap Wake Up</Text><Switch value={allowOneTapReveal} onValueChange={setAllowOneTapReveal} trackColor={{ true: '#007AFF' }} /></View>
          <View style={styles.switchRow}><Text style={styles.label}>Enable Odometer Animation</Text><Switch value={enableAnimation} onValueChange={setEnableAnimation} trackColor={{ true: '#007AFF' }} /></View>
          <View style={styles.switchRow}><Text style={styles.label}>Show 12-Hour Numbers</Text><Switch value={showClockNumbers} onValueChange={setShowClockNumbers} trackColor={{ true: '#007AFF' }} /></View>

          <Text style={styles.sectionHeader}>Advanced Color Control</Text>
          <AdvancedColorPicker label="1. Background Color" color={bgColor} onColorChange={setBgColor} />
          <AdvancedColorPicker label="2. Main Dial Hands" color={hourMinColor} onColorChange={setHourMinColor} />
          <AdvancedColorPicker label="3. Second Hand" color={secondColor} onColorChange={setSecondColor} />
          <AdvancedColorPicker label="4. Digital Numbers" color={digitalColor} onColorChange={setDigitalColor} />
          <AdvancedColorPicker label="5. Subtext Labels" color={subTextColor} onColorChange={setSubTextColor} />
          <AdvancedColorPicker label="6. Atmosphere Glow" color={cinematicColor} onColorChange={setCinematicColor} />

          <View style={styles.buttonRow}>
            <Button title="Apply Configuration" onPress={() => saveSettings(false)} color="#34C759" />
            <View style={{height: 10}} />
            <Button title="Re-Initialize System" onPress={() => saveSettings(true)} color="#007AFF" />
          </View>
          <View style={{height: 100}} />
        </ScrollView>
      </View>
    );
  }

  const hasMainSub = primarySubtext !== 'NONE' && primarySubtext.trim() !== '';
  const hasHint1 = statusHint !== 'NONE' && statusHint.trim() !== '';
  const hasHint2 = statusHint2 !== 'NONE' && statusHint2.trim() !== '';
  let clockMargin = hasHint1 || hasHint2 || hasMainSub ? 60 : -30;

  const BackgroundComponent = useGradient ? LinearGradient : View;
  const backgroundProps = useGradient 
    ? { colors: [bgColor, gradientColor], locations: gradientType === 'circular' ? [0.2, 1] : [0, 1], style: styles.container } 
    : { style: [styles.container, { backgroundColor: bgColor }] };

  return (
    <BackgroundComponent {...backgroundProps}>
      <Pressable style={{flex:1}} onPress={() => allowOneTapReveal && setShowDigital(true)} delayLongPress={3000} onLongPress={() => setShowSettings(true)}>
        <StatusBar hidden={true} />
        <Animated.View style={[styles.layoutManager, { opacity: flickerAnim, transform: [{ translateX: glitchTranslateX }] }]}>
          <View style={[styles.clockWrapper, {marginTop: clockMargin}]}>
            {enableGlowFX && <View pointerEvents="none" style={styles.glowContainer}>{renderGlowLayer(360, 0)}{renderGlowLayer(280, 1)}</View>}
            <View style={styles.handsContainer}>
              {renderClockNumbers()}
              <View style={[styles.handWrapper, { transform: [{ rotate: `${(hours%12)*30 + minutes/2}deg` }] }]}><View style={[styles.hourHand, { backgroundColor: hourMinColor }]} /></View>
              <View style={[styles.handWrapper, { transform: [{ rotate: `${minutes*6}deg` }] }]}><View style={[styles.minuteHand, { backgroundColor: hourMinColor }]} /></View>
              <View style={[styles.handWrapper, { transform: [{ rotate: `${seconds*6}deg` }] }]}><View style={[styles.secondHand, { backgroundColor: secondColor }]} /></View>
            </View>
          </View>

          <Animated.View style={[styles.digitalContainer, { opacity: visibilityAnim }]}>
            {renderDetailed ? (
              <View style={styles.timeRow}>
                {/* 🚀 FULL TRIPLE ODOMETER */}
                {enableAnimation ? (
                  <>
                    <SlidingOdometer value={hoursLeft} textColor={digitalColor} selectedFont={selectedFont} />
                    <Text style={[styles.digitalTextMain, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>:</Text>
                    <SlidingOdometer value={minsLeft} textColor={digitalColor} selectedFont={selectedFont} />
                    <Text style={[styles.digitalTextMain, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>:</Text>
                    <SlidingOdometer value={secsLeft} textColor={digitalColor} selectedFont={selectedFont} />
                  </>
                ) : (
                  <Text style={[styles.digitalTextMain, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>{hoursLeft}:{minsLeft}:{secsLeft}</Text>
                )}
              </View>
            ) : (
              <Text style={[styles.digitalTextMain, { color: digitalColor, fontFamily: getFontFamily(selectedFont) }]}>{daysLeft}</Text>
            )}
            {hasMainSub && <Text style={[styles.digitalSub, { color: subTextColor, fontFamily: getFontFamily(selectedFont) }]}>{primarySubtext}</Text>}
            {hasHint1 && <Text style={[styles.statusHintText, { color: subTextColor, fontFamily: getFontFamily(selectedFont) }]}>[ {statusHint} ]</Text>}
            {hasHint2 && <Text style={[styles.statusHintText, { color: subTextColor, fontFamily: getFontFamily(selectedFont), marginTop: 6 }]}>[ {statusHint2} ]</Text>}
          </Animated.View>
        </Animated.View>
      </Pressable>
    </BackgroundComponent>
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
  digitalContainer: { position: 'absolute', top: '15%', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  digitalTextMain: { fontSize: 72, letterSpacing: 2, lineHeight: 80 },
  slidingSecondsContainer: { height: 80, overflow: 'hidden' },
  odometerText: { lineHeight: 80 },
  digitalSub: { fontSize: 16, letterSpacing: 6, marginTop: 15, opacity: 0.8 },
  statusHintText: { fontSize: 12, letterSpacing: 6, marginTop: 22, opacity: 0.4 },
  settingsContainer: { flex: 1, backgroundColor: '#1A1A1A' },
  scrollContent: { padding: 25, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginTop: 25, borderBottomWidth: 1, borderBottomColor: '#333' },
  label: { fontSize: 14, color: '#AAA', fontWeight: '600' },
  timeInputRow: { flexDirection: 'row', marginTop: 5, justifyContent: 'space-between' },
  timeInputWrapper: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#555', backgroundColor: '#333', color: '#FFF', padding: 8, borderRadius: 8 },
  frozenContainer: { marginTop: 15, padding: 15, backgroundColor: '#2A2A2A', borderRadius: 10 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#333', borderRadius: 8, padding: 4 },
  segmentButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#555' },
  segmentText: { fontSize: 14, color: '#AAA' },
  segmentTextActive: { color: '#FFF', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  optionBtn: { padding: 12, backgroundColor: '#333', borderRadius: 8, marginBottom: 6 },
  optionBtnActive: { backgroundColor: '#007AFF' },
  optionText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
  optionTextActive: { fontWeight: 'bold' },
  chipBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#333', borderRadius: 20 },
  chipBtnActive: { backgroundColor: '#FF3B30' },
  chipText: { color: '#FFF', fontSize: 12 },
  inputWithDropdownRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', borderRadius: 8, overflow: 'hidden' },
  inputWithDropdownText: { flex: 1, padding: 10, fontSize: 14, color: '#FFF' },
  dropdownIconButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 12 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#333', borderRadius: 8, padding: 12 },
  dropdownHeaderText: { color: '#FFF' },
  dropdownListContainer: { backgroundColor: '#333', borderRadius: 8, marginTop: 5 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#444' },
  dropdownItemText: { color: '#FFF' },
  colorPickerContainer: { backgroundColor: '#2A2A2A', padding: 15, borderRadius: 12, marginBottom: 15 },
  colorPickerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  hexInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 10, borderRadius: 8 },
  colorPreviewBubble: { width: 24, height: 24, borderRadius: 12, marginRight: 10 },
  hexLabel: { color: '#AAA' },
  hexInput: { color: '#FFF', fontSize: 16, flex: 1 },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  slider: { flex: 1, height: 40 },
  sliderValue: { width: 35, textAlign: 'right', color: '#FFF' },
});