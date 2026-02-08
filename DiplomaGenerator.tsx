import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Course {
  id: string;
  name: string;
}

interface DiplomaData {
  code: string;
  studentName: string;
  institution: string;
  issueDate: string;
  courses: string[];
  totalHours: string;
  directorName: string;
  language: string;
  generatedAt: string;
}

interface Translation {
  diplomaTitle: string;
  diplomaSubtitle: string;
  certifyText: string;
  completedText: string;
  coursesTitle: string;
  totalHoursText: string;
  dateText: string;
  directorLabel: string;
  labelStudentName: string;
  labelInstitution: string;
  labelDate: string;
  labelCourses: string;
  labelHours: string;
  labelDirector: string;
}

const translations: Record<string, Translation> = {
  es: {
    diplomaTitle: "DIPLOMA DE RECONOCIMIENTO",
    diplomaSubtitle: "Certificado de Excelencia Académica",
    certifyText: "Se certifica que",
    completedText: "ha completado satisfactoriamente el programa de estudios",
    coursesTitle: "Cursos Completados:",
    totalHoursText: "Horas Totales:",
    dateText: "Fecha de emisión:",
    directorLabel: "Director Académico",
    labelStudentName: "Nombre del Estudiante",
    labelInstitution: "Institución",
    labelDate: "Fecha de Emisión",
    labelCourses: "Cursos Completados",
    labelHours: "Horas Totales",
    labelDirector: "Nombre del Director",
  },
  en: {
    diplomaTitle: "CERTIFICATE OF ACHIEVEMENT",
    diplomaSubtitle: "Certificate of Academic Excellence",
    certifyText: "This certifies that",
    completedText: "has successfully completed the study program",
    coursesTitle: "Completed Courses:",
    totalHoursText: "Total Hours:",
    dateText: "Issue Date:",
    directorLabel: "Academic Director",
    labelStudentName: "Student Name",
    labelInstitution: "Institution",
    labelDate: "Issue Date",
    labelCourses: "Completed Courses",
    labelHours: "Total Hours",
    labelDirector: "Director Name",
  },
  pt: {
    diplomaTitle: "DIPLOMA DE RECONHECIMENTO",
    diplomaSubtitle: "Certificado de Excelência Acadêmica",
    certifyText: "Certifica-se que",
    completedText: "completou satisfatoriamente o programa de estudos",
    coursesTitle: "Cursos Concluídos:",
    totalHoursText: "Horas Totais:",
    dateText: "Data de emissão:",
    directorLabel: "Diretor Acadêmico",
    labelStudentName: "Nome do Estudante",
    labelInstitution: "Instituição",
    labelDate: "Data de Emissão",
    labelCourses: "Cursos Concluídos",
    labelHours: "Horas Totais",
    labelDirector: "Nome do Diretor",
  },
  fr: {
    diplomaTitle: "DIPLÔME DE RECONNAISSANCE",
    diplomaSubtitle: "Certificat d'Excellence Académique",
    certifyText: "Certifie que",
    completedText: "a terminé avec succès le programme d'études",
    coursesTitle: "Cours Terminés:",
    totalHoursText: "Heures Totales:",
    dateText: "Date d'émission:",
    directorLabel: "Directeur Académique",
    labelStudentName: "Nom de l'Étudiant",
    labelInstitution: "Institution",
    labelDate: "Date d'Émission",
    labelCourses: "Cours Terminés",
    labelHours: "Heures Totales",
    labelDirector: "Nom du Directeur",
  },
  de: {
    diplomaTitle: "ANERKENNUNGSDIPLOM",
    diplomaSubtitle: "Zertifikat für akademische Exzellenz",
    certifyText: "Hiermit wird bescheinigt, dass",
    completedText: "das Studienprogramm erfolgreich abgeschlossen hat",
    coursesTitle: "Abgeschlossene Kurse:",
    totalHoursText: "Gesamtstunden:",
    dateText: "Ausstellungsdatum:",
    directorLabel: "Akademischer Direktor",
    labelStudentName: "Name des Studenten",
    labelInstitution: "Institution",
    labelDate: "Ausstellungsdatum",
    labelCourses: "Abgeschlossene Kurse",
    labelHours: "Gesamtstunden",
    labelDirector: "Name des Direktors",
  },
  it: {
    diplomaTitle: "DIPLOMA DI RICONOSCIMENTO",
    diplomaSubtitle: "Certificato di Eccellenza Accademica",
    certifyText: "Si certifica che",
    completedText: "ha completato con successo il programma di studi",
    coursesTitle: "Corsi Completati:",
    totalHoursText: "Ore Totali:",
    dateText: "Data di emissione:",
    directorLabel: "Direttore Accademico",
    labelStudentName: "Nome dello Studente",
    labelInstitution: "Istituzione",
    labelDate: "Data di Emissione",
    labelCourses: "Corsi Completati",
    labelHours: "Ore Totali",
    labelDirector: "Nome del Direttore",
  },
  zh: {
    diplomaTitle: "荣誉证书",
    diplomaSubtitle: "学术卓越证书",
    certifyText: "兹证明",
    completedText: "已圆满完成学习课程",
    coursesTitle: "已完成课程：",
    totalHoursText: "总学时：",
    dateText: "颁发日期：",
    directorLabel: "学术主任",
    labelStudentName: "学生姓名",
    labelInstitution: "机构",
    labelDate: "颁发日期",
    labelCourses: "已完成课程",
    labelHours: "总学时",
    labelDirector: "主任姓名",
  },
  ja: {
    diplomaTitle: "認定証書",
    diplomaSubtitle: "学術優秀証明書",
    certifyText: "これは証明する",
    completedText: "が学習プログラムを無事に修了したことを",
    coursesTitle: "修了コース：",
    totalHoursText: "総時間：",
    dateText: "発行日：",
    directorLabel: "学術ディレクター",
    labelStudentName: "学生名",
    labelInstitution: "機関",
    labelDate: "発行日",
    labelCourses: "修了コース",
    labelHours: "総時間",
    labelDirector: "ディレクター名",
  },
  ar: {
    diplomaTitle: "شهادة تقدير",
    diplomaSubtitle: "شهادة التميز الأكاديمي",
    certifyText: "يشهد بأن",
    completedText: "قد أكمل بنجاح برنامج الدراسات",
    coursesTitle: "الدورات المكتملة:",
    totalHoursText: "إجمالي الساعات:",
    dateText: "تاريخ الإصدار:",
    directorLabel: "المدير الأكاديمي",
    labelStudentName: "اسم الطالب",
    labelInstitution: "المؤسسة",
    labelDate: "تاريخ الإصدار",
    labelCourses: "الدورات المكتملة",
    labelHours: "إجمالي الساعات",
    labelDirector: "اسم المدير",
  },
  ru: {
    diplomaTitle: "ДИПЛОМ О ПРИЗНАНИИ",
    diplomaSubtitle: "Сертификат академического совершенства",
    certifyText: "Настоящим удостоверяется, что",
    completedText: "успешно завершил программу обучения",
    coursesTitle: "Завершенные курсы:",
    totalHoursText: "Общее количество часов:",
    dateText: "Дата выдачи:",
    directorLabel: "Академический директор",
    labelStudentName: "Имя студента",
    labelInstitution: "Учреждение",
    labelDate: "Дата выдачи",
    labelCourses: "Завершенные курсы",
    labelHours: "Общее количество часов",
    labelDirector: "Имя директора",
  },
};

const DiplomaGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"generator" | "validator">(
    "generator",
  );
  const [language, setLanguage] = useState<string>("es");
  const [studentName, setStudentName] = useState<string>("");
  const [institution, setInstitution] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [totalHours, setTotalHours] = useState<string>("");
  const [directorName, setDirectorName] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([{ id: "1", name: "" }]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [diplomaData, setDiplomaData] = useState<DiplomaData | null>(null);
  const [validationCode, setValidationCode] = useState<string>("");
  const [validationResult, setValidationResult] = useState<DiplomaData | null>(
    null,
  );
  const [validationError, setValidationError] = useState<boolean>(false);

  const diplomaRef = useRef<ViewShot>(null);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isLargeScreen = width > 768;

  const t = translations[language];

  const generateUniqueCode = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `DIP-2026-${timestamp}-${random}`.toUpperCase();
  };

  const addCourse = () => {
    setCourses([...courses, { id: Date.now().toString(), name: "" }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const updateCourse = (id: string, name: string) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const saveDiploma = async (data: DiplomaData) => {
    try {
      const existing = await AsyncStorage.getItem("diplomas");
      const diplomas = existing ? JSON.parse(existing) : [];
      diplomas.push(data);
      await AsyncStorage.setItem("diplomas", JSON.stringify(diplomas));
    } catch (error) {
      console.error("Error saving diploma:", error);
    }
  };

  const generateDiploma = async () => {
    if (!studentName || !institution || !issueDate) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios");
      return;
    }

    const filteredCourses = courses.filter((c) => c.name.trim());
    if (filteredCourses.length === 0) {
      Alert.alert("Error", "Por favor agregue al menos un curso");
      return;
    }

    const code = generateUniqueCode();
    const data: DiplomaData = {
      code,
      studentName,
      institution,
      issueDate,
      courses: filteredCourses.map((c) => c.name),
      totalHours,
      directorName,
      language,
      generatedAt: new Date().toISOString(),
    };

    setDiplomaData(data);
    await saveDiploma(data);
    setShowPreview(true);
  };

  const validateCode = async () => {
    if (!validationCode.trim()) {
      Alert.alert("Error", "Por favor ingrese un código");
      return;
    }

    try {
      const existing = await AsyncStorage.getItem("diplomas");
      const diplomas: DiplomaData[] = existing ? JSON.parse(existing) : [];
      const diploma = diplomas.find((d) => d.code === validationCode.trim());

      if (diploma) {
        setValidationResult(diploma);
        setValidationError(false);
      } else {
        setValidationResult(null);
        setValidationError(true);
      }
    } catch (error) {
      Alert.alert("Error", "Error al validar el código");
    }
  };

  const downloadPNG = async () => {
    try {
      if (Platform.OS === "web") {
        // Web download
        if (diplomaRef.current && diplomaRef.current.capture) {
          const uri = await diplomaRef.current.capture();
          const link = document.createElement("a");
          link.download = `diploma-${diplomaData?.code}.png`;
          link.href = uri;
          link.click();
        }
      } else {
        // Mobile download
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Error", "Se necesitan permisos para guardar la imagen");
          return;
        }

        if (diplomaRef.current && diplomaRef.current.capture) {
          const uri = await diplomaRef.current.capture();
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert("Éxito", "Diploma guardado en la galería");
        }
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el diploma");
      console.error(error);
    }
  };

  const shareDiploma = async () => {
    try {
      if (diplomaRef.current && diplomaRef.current.capture) {
        const uri = await diplomaRef.current.capture();
        if (Platform.OS === "web") {
          // Web share or download fallback
          const link = document.createElement("a");
          link.download = `diploma-${diplomaData?.code}.png`;
          link.href = uri;
          link.click();
        } else {
          await Sharing.shareAsync(uri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir el diploma");
      console.error(error);
    }
  };

  const formatDate = (dateString: string, lang: string): string => {
    const date = new Date(dateString + "T00:00:00");
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const locales: Record<string, string> = {
      es: "es-ES",
      en: "en-US",
      pt: "pt-PT",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      zh: "zh-CN",
      ja: "ja-JP",
      ar: "ar-SA",
      ru: "ru-RU",
    };
    return date.toLocaleDateString(locales[lang] || "es-ES", options);
  };

  const renderDiploma = () => {
    if (!diplomaData) return null;

    return (
      <ViewShot ref={diplomaRef} options={{ format: "png", quality: 1.0 }}>
        <View
          style={[
            styles.diplomaContainer,
            isLargeScreen && styles.diplomaContainerLarge,
          ]}
        >
          <View style={styles.diplomaBorder}>
            {/* Header */}
            <View style={styles.diplomaHeader}>
              <Text
                style={[
                  styles.diplomaTitle,
                  isLargeScreen && styles.diplomaTitleLarge,
                ]}
              >
                {t.diplomaTitle}
              </Text>
              <Text
                style={[
                  styles.diplomaSubtitle,
                  isLargeScreen && styles.diplomaSubtitleLarge,
                ]}
              >
                {t.diplomaSubtitle}
              </Text>
            </View>

            {/* Body */}
            <View style={styles.diplomaBody}>
              <Text
                style={[
                  styles.diplomaText,
                  isLargeScreen && styles.diplomaTextLarge,
                ]}
              >
                {t.certifyText}
              </Text>
              <Text
                style={[
                  styles.studentName,
                  isLargeScreen && styles.studentNameLarge,
                ]}
              >
                {diplomaData.studentName}
              </Text>
              <Text
                style={[
                  styles.diplomaText,
                  isLargeScreen && styles.diplomaTextLarge,
                ]}
              >
                {t.completedText}
              </Text>
              <Text
                style={[
                  styles.institutionName,
                  isLargeScreen && styles.institutionNameLarge,
                ]}
              >
                {diplomaData.institution}
              </Text>

              {/* Courses */}
              <View style={styles.courseSection}>
                <Text
                  style={[
                    styles.coursesTitle,
                    isLargeScreen && styles.coursesTitleLarge,
                  ]}
                >
                  {t.coursesTitle}
                </Text>
                {diplomaData.courses.map((course, index) => (
                  <View key={index} style={styles.courseItem}>
                    <Text
                      style={[
                        styles.checkmark,
                        isLargeScreen && styles.checkmarkLarge,
                      ]}
                    >
                      ✓
                    </Text>
                    <Text
                      style={[
                        styles.courseText,
                        isLargeScreen && styles.courseTextLarge,
                      ]}
                    >
                      {course}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                style={[
                  styles.diplomaText,
                  isLargeScreen && styles.diplomaTextLarge,
                ]}
              >
                <Text style={styles.bold}>{t.totalHoursText}</Text>{" "}
                {diplomaData.totalHours} {language === "en" ? "hours" : "horas"}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.diplomaFooter}>
              {/* Signature */}
              <View style={styles.signatureSection}>
                <View
                  style={[
                    styles.signatureLine,
                    isLargeScreen && styles.signatureLineLarge,
                  ]}
                />
                <Text
                  style={[
                    styles.signatureText,
                    isLargeScreen && styles.signatureTextLarge,
                  ]}
                >
                  {diplomaData.directorName}
                </Text>
                <Text
                  style={[
                    styles.signatureText,
                    styles.bold,
                    isLargeScreen && styles.signatureTextLarge,
                  ]}
                >
                  {t.directorLabel}
                </Text>
              </View>

              {/* QR Code */}
              <View style={styles.qrSection}>
                <QRCode
                  value={diplomaData.code}
                  size={isLargeScreen ? 100 : 80}
                />
                <Text
                  style={[
                    styles.dateText,
                    isLargeScreen && styles.dateTextLarge,
                  ]}
                >
                  {t.dateText}{" "}
                  {formatDate(diplomaData.issueDate, diplomaData.language)}
                </Text>
              </View>
            </View>

            {/* Code */}
            <View style={styles.codeSection}>
              <Text
                style={[styles.codeText, isLargeScreen && styles.codeTextLarge]}
              >
                <Text style={styles.bold}>Código de Validación:</Text>{" "}
                {diplomaData.code}
              </Text>
            </View>
          </View>
        </View>
      </ViewShot>
    );
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <View style={[styles.wrapper, isLargeScreen && styles.wrapperLarge]}>
        {/* Header */}
        <View style={[styles.header, isLargeScreen && styles.headerLarge]}>
          <Text
            style={[
              styles.headerTitle,
              isLargeScreen && styles.headerTitleLarge,
            ]}
          >
            🎓 Sistema de Diplomas
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              isLargeScreen && styles.headerSubtitleLarge,
            ]}
          >
            Generador y Validador Profesional
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, isLargeScreen && styles.tabsLarge]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "generator" && styles.tabButtonActive,
              isLargeScreen && styles.tabButtonLarge,
            ]}
            onPress={() => setActiveTab("generator")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "generator" && styles.tabTextActive,
                isLargeScreen && styles.tabTextLarge,
              ]}
            >
              Generador
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "validator" && styles.tabButtonActive,
              isLargeScreen && styles.tabButtonLarge,
            ]}
            onPress={() => setActiveTab("validator")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "validator" && styles.tabTextActive,
                isLargeScreen && styles.tabTextLarge,
              ]}
            >
              Validador
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.scrollContentLarge,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* GENERATOR TAB */}
          {activeTab === "generator" && (
            <View
              style={[
                styles.tabContent,
                isLargeScreen && styles.tabContentLarge,
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  isLargeScreen && styles.sectionTitleLarge,
                ]}
              >
                Generar Diploma
              </Text>

              <View style={[isLargeScreen && styles.formRow]}>
                {/* Language */}
                <View
                  style={[
                    styles.formGroup,
                    isLargeScreen && styles.formGroupHalf,
                  ]}
                >
                  <Text
                    style={[styles.label, isLargeScreen && styles.labelLarge]}
                  >
                    Idioma / Language
                  </Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={language}
                      onValueChange={setLanguage}
                      style={styles.picker}
                    >
                      <Picker.Item label="Español" value="es" />
                      <Picker.Item label="English" value="en" />
                      <Picker.Item label="Português" value="pt" />
                      <Picker.Item label="Français" value="fr" />
                      <Picker.Item label="Deutsch" value="de" />
                      <Picker.Item label="Italiano" value="it" />
                      <Picker.Item label="中文" value="zh" />
                      <Picker.Item label="日本語" value="ja" />
                      <Picker.Item label="العربية" value="ar" />
                      <Picker.Item label="Русский" value="ru" />
                    </Picker>
                  </View>
                </View>

                {/* Student Name */}
                <View
                  style={[
                    styles.formGroup,
                    isLargeScreen && styles.formGroupHalf,
                  ]}
                >
                  <Text
                    style={[styles.label, isLargeScreen && styles.labelLarge]}
                  >
                    {t.labelStudentName}
                  </Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    value={studentName}
                    onChangeText={setStudentName}
                    placeholder="Juan Pérez García"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={[isLargeScreen && styles.formRow]}>
                {/* Institution */}
                <View
                  style={[
                    styles.formGroup,
                    isLargeScreen && styles.formGroupHalf,
                  ]}
                >
                  <Text
                    style={[styles.label, isLargeScreen && styles.labelLarge]}
                  >
                    {t.labelInstitution}
                  </Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    value={institution}
                    onChangeText={setInstitution}
                    placeholder="Universidad Internacional"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Issue Date */}
                <View
                  style={[
                    styles.formGroup,
                    isLargeScreen && styles.formGroupHalf,
                  ]}
                >
                  <Text
                    style={[styles.label, isLargeScreen && styles.labelLarge]}
                  >
                    {t.labelDate}
                  </Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    value={issueDate}
                    onChangeText={setIssueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Courses */}
              <View style={styles.formGroup}>
                <Text
                  style={[styles.label, isLargeScreen && styles.labelLarge]}
                >
                  {t.labelCourses}
                </Text>
                {courses.map((course) => (
                  <View key={course.id} style={styles.courseInputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.courseInput,
                        isLargeScreen && styles.inputLarge,
                      ]}
                      value={course.name}
                      onChangeText={(text) => updateCourse(course.id, text)}
                      placeholder="Nombre del curso"
                      placeholderTextColor="#999"
                    />
                    {courses.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeCourseButton}
                        onPress={() => removeCourse(course.id)}
                      >
                        <Text style={styles.removeCourseText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addCourseButton}
                  onPress={addCourse}
                >
                  <Text
                    style={[
                      styles.addCourseText,
                      isLargeScreen && styles.addCourseTextLarge,
                    ]}
                  >
                    + Agregar Curso
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[isLargeScreen && styles.formRow]}>
                {/* Total Hours */}
                <View
                  style={[
                    styles.formGroup,
                    isLargeScreen && styles.formGroupHalf,
                  ]}
                >
                  <Text
                    style={[styles.label, isLargeScreen && styles.labelLarge]}
                  >
                    {t.labelHours}
                  </Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    value={totalHours}
                    onChangeText={setTotalHours}
                    placeholder="120"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Director Name */}
                <View
                  style={[
                    styles.formGroup,
                    isLargeScreen && styles.formGroupHalf,
                  ]}
                >
                  <Text
                    style={[styles.label, isLargeScreen && styles.labelLarge]}
                  >
                    {t.labelDirector}
                  </Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    value={directorName}
                    onChangeText={setDirectorName}
                    placeholder="Dr. María González"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLargeScreen && styles.primaryButtonLarge,
                ]}
                onPress={generateDiploma}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isLargeScreen && styles.buttonTextLarge,
                  ]}
                >
                  🎓 Generar Diploma
                </Text>
              </TouchableOpacity>

              {/* Preview */}
              {showPreview && (
                <View
                  style={[
                    styles.previewSection,
                    isLargeScreen && styles.previewSectionLarge,
                  ]}
                >
                  {renderDiploma()}

                  <View
                    style={[
                      styles.downloadButtons,
                      isLargeScreen && styles.downloadButtonsLarge,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        isLargeScreen && styles.secondaryButtonLarge,
                      ]}
                      onPress={downloadPNG}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isLargeScreen && styles.buttonTextLarge,
                        ]}
                      >
                        📥 {isWeb ? "Descargar PNG" : "Guardar PNG"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        isLargeScreen && styles.secondaryButtonLarge,
                      ]}
                      onPress={shareDiploma}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isLargeScreen && styles.buttonTextLarge,
                        ]}
                      >
                        📤 Compartir
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* VALIDATOR TAB */}
          {activeTab === "validator" && (
            <View
              style={[
                styles.tabContent,
                isLargeScreen && styles.tabContentLarge,
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  isLargeScreen && styles.sectionTitleLarge,
                ]}
              >
                Validar Diploma
              </Text>

              <View style={styles.formGroup}>
                <Text
                  style={[styles.label, isLargeScreen && styles.labelLarge]}
                >
                  Código del Diploma
                </Text>
                <TextInput
                  style={[styles.input, isLargeScreen && styles.inputLarge]}
                  value={validationCode}
                  onChangeText={setValidationCode}
                  placeholder="DIP-2026-XXXXXXXX"
                  autoCapitalize="characters"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLargeScreen && styles.primaryButtonLarge,
                ]}
                onPress={validateCode}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isLargeScreen && styles.buttonTextLarge,
                  ]}
                >
                  🔍 Validar Código
                </Text>
              </TouchableOpacity>

              {/* Validation Result */}
              {validationResult && (
                <View
                  style={[
                    styles.validationSuccess,
                    isLargeScreen && styles.validationBoxLarge,
                  ]}
                >
                  <Text
                    style={[
                      styles.validationTitle,
                      isLargeScreen && styles.validationTitleLarge,
                    ]}
                  >
                    ✅ Diploma Válido
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Código:</Text>{" "}
                    {validationResult.code}
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Estudiante:</Text>{" "}
                    {validationResult.studentName}
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Institución:</Text>{" "}
                    {validationResult.institution}
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Fecha:</Text>{" "}
                    {formatDate(
                      validationResult.issueDate,
                      validationResult.language,
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Cursos:</Text>{" "}
                    {validationResult.courses.join(", ")}
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Horas:</Text>{" "}
                    {validationResult.totalHours}
                  </Text>
                </View>
              )}

              {validationError && (
                <View
                  style={[
                    styles.validationError,
                    isLargeScreen && styles.validationBoxLarge,
                  ]}
                >
                  <Text
                    style={[
                      styles.validationTitle,
                      isLargeScreen && styles.validationTitleLarge,
                    ]}
                  >
                    ❌ Diploma No Válido
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    El código ingresado no corresponde a ningún diploma
                    registrado.
                  </Text>
                  <Text
                    style={[
                      styles.validationText,
                      isLargeScreen && styles.validationTextLarge,
                    ]}
                  >
                    <Text style={styles.bold}>Código verificado:</Text>{" "}
                    {validationCode}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  wrapperLarge: {
    maxWidth: 1200,
  },
  header: {
    paddingTop: Platform.OS === "web" ? 40 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerLarge: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerTitleLarge: {
    fontSize: 36,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  headerSubtitleLarge: {
    fontSize: 16,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tabsLarge: {
    paddingHorizontal: 40,
    gap: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    alignItems: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.3s ease",
      },
    }),
  },
  tabButtonLarge: {
    paddingVertical: 18,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#fff",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
      },
    }),
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  tabTextLarge: {
    fontSize: 18,
  },
  tabTextActive: {
    color: "#1a237e",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentLarge: {
    paddingBottom: 60,
  },
  tabContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    minHeight: "100%",
  },
  tabContentLarge: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a237e",
    marginBottom: 20,
  },
  sectionTitleLarge: {
    fontSize: 28,
    marginBottom: 30,
  },
  formRow: {
    flexDirection: "row",
    gap: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  labelLarge: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  inputLarge: {
    padding: 14,
    fontSize: 16,
    borderRadius: 10,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
  },
  courseInputContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  courseInput: {
    flex: 1,
  },
  removeCourseButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  removeCourseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addCourseButton: {
    borderWidth: 2,
    borderColor: "#1a237e",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 5,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.3s ease",
      },
    }),
  },
  addCourseText: {
    color: "#1a237e",
    fontSize: 14,
    fontWeight: "bold",
  },
  addCourseTextLarge: {
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#1a237e",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.3s ease",
      },
    }),
  },
  primaryButtonLarge: {
    padding: 18,
    borderRadius: 12,
    marginTop: 15,
  },
  secondaryButton: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.3s ease",
      },
    }),
  },
  secondaryButtonLarge: {
    padding: 18,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonTextLarge: {
    fontSize: 18,
  },
  previewSection: {
    marginTop: 30,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 15,
  },
  previewSectionLarge: {
    marginTop: 40,
    borderRadius: 15,
    padding: 25,
  },
  downloadButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  downloadButtonsLarge: {
    gap: 15,
    marginTop: 20,
  },
  // Diploma Styles
  diplomaContainer: {
    backgroundColor: "#fff",
    padding: 15,
  },
  diplomaContainerLarge: {
    padding: 25,
  },
  diplomaBorder: {
    borderWidth: 8,
    borderColor: "#ffd700",
    borderRadius: 5,
    padding: 30,
    backgroundColor: "#fff",
  },
  diplomaHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  diplomaTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a237e",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 8,
  },
  diplomaTitleLarge: {
    fontSize: 32,
    marginBottom: 12,
  },
  diplomaSubtitle: {
    fontSize: 14,
    color: "#757575",
    fontStyle: "italic",
    textAlign: "center",
  },
  diplomaSubtitleLarge: {
    fontSize: 18,
  },
  diplomaBody: {
    alignItems: "center",
    marginVertical: 20,
  },
  diplomaText: {
    fontSize: 12,
    color: "#212121",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 20,
  },
  diplomaTextLarge: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 15,
  },
  studentName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a237e",
    textAlign: "center",
    marginVertical: 15,
    textDecorationLine: "underline",
    textDecorationColor: "#ffd700",
  },
  studentNameLarge: {
    fontSize: 32,
    marginVertical: 20,
  },
  institutionName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
    marginBottom: 15,
  },
  institutionNameLarge: {
    fontSize: 18,
    marginBottom: 20,
  },
  courseSection: {
    width: "100%",
    marginVertical: 15,
  },
  coursesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a237e",
    textAlign: "center",
    marginBottom: 10,
  },
  coursesTitleLarge: {
    fontSize: 18,
    marginBottom: 15,
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingLeft: 20,
  },
  checkmark: {
    color: "#4caf50",
    fontWeight: "bold",
    marginRight: 8,
    fontSize: 14,
  },
  checkmarkLarge: {
    fontSize: 18,
    marginRight: 12,
  },
  courseText: {
    fontSize: 11,
    color: "#212121",
  },
  courseTextLarge: {
    fontSize: 15,
  },
  diplomaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#1a237e",
  },
  signatureSection: {
    flex: 1,
    alignItems: "center",
  },
  signatureLine: {
    width: 120,
    borderTopWidth: 2,
    borderTopColor: "#212121",
    marginBottom: 8,
    marginTop: 25,
  },
  signatureLineLarge: {
    width: 160,
    marginTop: 35,
    marginBottom: 12,
  },
  signatureText: {
    fontSize: 10,
    color: "#212121",
    textAlign: "center",
  },
  signatureTextLarge: {
    fontSize: 13,
  },
  qrSection: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 9,
    color: "#757575",
    marginTop: 8,
    textAlign: "center",
  },
  dateTextLarge: {
    fontSize: 11,
    marginTop: 10,
  },
  codeSection: {
    marginTop: 15,
    alignItems: "center",
  },
  codeText: {
    fontSize: 9,
    color: "#757575",
    textAlign: "center",
  },
  codeTextLarge: {
    fontSize: 11,
  },
  bold: {
    fontWeight: "bold",
  },
  // Validation Styles
  validationSuccess: {
    backgroundColor: "#e8f5e9",
    borderWidth: 2,
    borderColor: "#4caf50",
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  validationError: {
    backgroundColor: "#ffebee",
    borderWidth: 2,
    borderColor: "#f44336",
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  validationBoxLarge: {
    padding: 30,
    borderRadius: 12,
    marginTop: 30,
  },
  validationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  validationTitleLarge: {
    fontSize: 22,
    marginBottom: 20,
  },
  validationText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  validationTextLarge: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
});

export default DiplomaGenerator;
