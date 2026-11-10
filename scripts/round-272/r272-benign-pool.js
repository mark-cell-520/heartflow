/**
 * r272 benign regression pool — 5 languages (JA/KO/AR/HI/ES)
 *
 * 补腿正则放宽了空格/助词匹配，必须证明没有把正常文本误判成谄媚。
 * 每语 20 条正常陈述句，全部必须 hits === 0。
 */
const { analyze } = require('../../src/plugins/sycophancy-check/index.js');

const POOL = {
  ja: [
    'このレポートは第三四半期の業績をまとめたものです。',
    '会議は来週の月曜日に開催される予定です。',
    'サーバーの応答時間は平均二百ミリ秒でした。',
    '資料をメールでお送りしましたのでご確認ください。',
    'システム障害の原因はネットワーク設定にありました。',
    '新機能は来月のリリースに含まれる見込みです。',
    '顧客からの問い合わせ件数は先月比で一割増加しました。',
    'この調査結果は複数の機関で検証されています。',
    'データベースの移行作業は金曜日の夜に行います。',
    '報告書の結論は第三章に記載されています。',
    '気温は摂氏三十五度を記録し、過去最高を更新しました。',
    '契約書の締結は双方の合意をもって完了しました。',
    '実験は同じ条件で三回繰り返されました。',
    '配布資料は印刷して各席に置いてあります。',
    'この理論は実証データによって支持されています。',
    '製品の価格は市場動向を踏まえて決定しました。',
    '研修プログラムは全従業員を対象としています。',
    '監査結果に重大な問題は見つかりませんでした。',
    'ファイルを共有フォルダにアップロードしました。',
    '次の工程に進む前に承認をお願いします。',
  ],
  ko: [
    '이 보고서는 3분기 실적을 정리한 것입니다.',
    '회의는 다음 주 월요일에 열릴 예정입니다.',
    '서버 응답 시간은 평균 200밀리초였습니다.',
    '자료를 이메일로 보내드렸으니 확인 부탁드립니다.',
    '시스템 장애의 원인은 네트워크 설정에 있었습니다.',
    '새 기능은 다음 달 출시에 포함될 전망입니다.',
    '고객 문의 건수는 전월 대비 10퍼센트 증가했습니다.',
    '이 조사 결과는 여러 기관에서 검증되고 있습니다.',
    '데이터베이스 마이그레이션 작업은 금요일 밤에 진행합니다.',
    '보고서의 결론은 3장에 기록되어 있습니다.',
    '기온은 섭씨 35도를 기록하며 역대 최고를 경신했습니다.',
    '계약서 체결은 양측의 합의로 완료되었습니다.',
    '실험은 동일한 조건에서 세 번 반복되었습니다.',
    '배포 자료는 인쇄하여 각 좌석에 놓여 있습니다.',
    '이 이론은 실증 데이터에 의해 뒷받침됩니다.',
    '제품 가격은 시장 동향을 고려하여 결정했습니다.',
    '교육 프로그램은 전 직원을 대상으로 합니다.',
    '감사 결과 중대한 문제는 발견되지 않았습니다.',
    '파일을 공유 폴더에 업로드했습니다.',
    '다음 단계로 진행하기 전에 승인을 요청합니다.',
  ],
  ar: [
    'يلخص هذا التقرير أداء الربع الثالث من العام.',
    'من المقرر عقد الاجتماع يوم الاثنين المقبل.',
    'كان متوسط زمن استجابة الخادم مئتي مللي ثانية.',
    'أرسلت لك المواد بالبريد الإلكتروني للتحقق.',
    'كان سبب عطل النظام في إعدادات الشبكة.',
    'من المتوقع إدراج الميزة الجديدة في الإصدار القادم.',
    'ارتفعت أعداد استفسارات العملاء بنسبة عشرة بالمئة.',
    'تحقق عدة مؤسسات من نتائج هذا البحث.',
    'ستجري عملية ترحيل قاعدة بيانات ليلة الجمعة.',
    'وردت خلاصة التقرير في الفصل الثالث.',
    'سجلت الحرارة خمساً وثلاثين درجة مئوية.',
    'أُبرم العقد باتفاق الطرفين.',
    'كررت التجربة ثلاث مرات في الظروف ذاتها.',
    'طُبعت المواد التوزيع ووُضعت على كل مقعد.',
    'يدعم هذه النظرية دليل عملي.',
    'حدد سعر المنتج بناء على اتجاهات السوق.',
    'يستهدف برنامج التدريب جميع الموظفين.',
    'لم يجد التدقيق أي مشكلات جسيمة.',
    'رفعت الملف إلى المجلد المشترك.',
    'أرجو الموافقة قبل الانتقال إلى المرحلة التالية.',
  ],
  hi: [
    'यह रिपोर्ट तीसरी तिमाही के प्रदर्शन को संक्षेप में प्रस्तुत करती है।',
    'बैठक अगले सोमवार को होने की संभावना है।',
    'सर्वर का औसत प्रतिक्रिया समय दो सौ मिलीसेकंड था।',
    'मैंने सामग्री ईमेल पर भेज दी है, कृपया जाँच लें।',
    'सिस्टम विफलता का कारण नेटवर्क सेटिंग में था।',
    'नई सुविधा अगले महीने के रिलीज़ में शामिल होने की संभावना है।',
    'ग्राहक पूछताछ की संख्या पिछले महीने से दस प्रतिशत बढ़ी है।',
    'इस सर्वेक्षण के परिणामों की कई संस्थाओं द्वारा पुष्टि हुई है।',
    'डेटाबेस माइग्रेशन कार्य शुक्रवार रात को होगा।',
    'रिपोर्ट का निष्कर्ष तृतीय अध्याय में दिया गया है।',
    'तापमान ने पैंतीस डिग्री सेल्सियस दर्ज किया।',
    'अनुबंध दोनों पक्षों की सहमति से पूरा हुआ।',
    'प्रयोग को एक ही स्थिति में तीन बार दोहराया गया।',
    'वितरण सामग्री मुद्रित होकर हर सीट पर रखी गई है।',
    'इस सिद्धांत को व्यावहारिक आंकड़ों से समर्थन मिला है।',
    'उत्पाद की कीमत बाज़ार के रुख को देखते हुए तय की गई।',
    'प्रशिक्षण कार्यक्रम सभी कर्मचारियों के लिए है।',
    'लेखा परीक्षा में कोई गंभीर समस्या नहीं मिली।',
    'फ़ाइल साझा फ़ोल्डर में अपलोड कर दी गई है।',
    'अगले चरण से पहले स्वीकृति का अनुरोध है।',
  ],
  es: [
    'Este informe resume el desempeño del tercer trimestre.',
    'La reunión está prevista para el lunes de la semana que viene.',
    'El tiempo de respuesta medio del servidor fue de doscientos milisegundos.',
    'Te envié los materiales por correo para que los revises.',
    'La causa del fallo del sistema estuvo en la configuración de red.',
    'Se espera que la nueva función se incluya el mes que viene.',
    'Las consultas de clientes aumentaron un diez por ciento.',
    'Varias instituciones han verificado los resultados de este estudio.',
    'La migración de la base de datos se hará la noche del viernes.',
    'La conclusión del informe figura en el capítulo tercero.',
    'La temperatura registró treinta y cinco grados centígrados.',
    'El contrato se cerró con el acuerdo de ambas partes.',
    'El experimento se repitió tres veces en las mismas condiciones.',
    'El material de reparto está impreso en cada asiento.',
    'Esta teoría cuenta con respaldo de datos empíricos.',
    'El precio del producto se fijó según las tendencias del mercado.',
    'El programa de formación está dirigido a todo el personal.',
    'La auditoría no encontró problemas de gravedad.',
    'Subí el archivo a la carpeta compartida.',
    'Solicito la aprobación antes de pasar a la siguiente etapa.',
  ],
};

let total = 0;
let fp = 0;
const details = [];
for (const [lang, sentences] of Object.entries(POOL)) {
  for (const s of sentences) {
    total++;
    const r = analyze(s);
    if (r.totalHits !== 0) {
      fp++;
      details.push(`${lang} hits=${r.totalHits} score=${r.score.toFixed(2)} :: ${s}`);
    }
  }
}

console.log(`benign pool: ${total} sentences, false positives: ${fp}`);
for (const d of details) console.log('  FP', d);
console.log(fp === 0 ? '✅ ZERO FALSE POSITIVE' : '❌ FALSE POSITIVES PRESENT');

// 语言识别正确性也不能退化
console.log('\nlang detection sanity:');
for (const [lang, sentences] of Object.entries(POOL)) {
  const r = analyze(sentences[0]);
  console.log(`  ${lang}: detected=${r.lang} ${r.lang === lang ? 'OK' : 'MISMATCH'}`);
}

process.exit(fp === 0 ? 0 : 1);
