// Структурированный учебный план для арабского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const arabicCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: 'ضمائر المتكلم وفعل "يكون"', description: 'أنا، أنت، هو/هي، نحن، أنتم، هم؛ يكون.' },
      { title: 'زمن المضارع للأفعال', description: 'تصريف الأفعال الأساسية.' },
      { title: 'المفرد والجمع للأسماء', description: 'جمع التكسير، جمع المذكر والمؤنث.' },
      { title: 'الجمل المنفية', description: 'لا، ليس.' },
      { title: 'الجمل الاستفهامية', description: 'هل، ماذا، من، أين.' },
      { title: 'حروف الجر الأساسية', description: 'في، على، تحت، أمام، خلف.' },
      { title: 'تعبيرات الزمن', description: 'اليوم، غداً، أمس.' },
      { title: 'الأعداد', description: 'واحد، اثنان، ثلاثة...' },
      { title: 'استخدام الصفات الأساسية', description: 'كبير، صغير، جيد، سيء.' },
      { title: 'تعبيرات أساسية', description: 'يوجد، لا يوجد، يمكن.' },
    ],
    vocabulary: [
      { title: 'التحيات والتعارف', description: 'مرحباً، وداعاً، اسمي...' },
      { title: 'العائلة', description: 'أم، أب، أخ، أخت...' },
      { title: 'الأرقام', description: 'واحد، اثنان، ثلاثة...' },
      { title: 'المهن', description: 'معلم، طبيب، طالب...' },
      { title: 'الطعام والشراب', description: 'خبز، ماء، تفاح...' },
      { title: 'الطقس', description: 'مشمس، ممطر، مثلج...' },
      { title: 'الأيام والشهور', description: 'الاثنين، يناير...' },
      { title: 'المدينة والمواصلات', description: 'حافلة، محطة، شارع...' },
      { title: 'المنزل والأثاث', description: 'طاولة، كرسي، غرفة...' },
      { title: 'التسوق', description: 'شراء، سعر، سوبرماركت...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'المقارنة والتفضيل', description: 'أكثر... من، الأكثر...' },
      { title: 'زمن الماضي', description: 'كان، فعل في الماضي.' },
      { title: 'زمن المستقبل', description: 'سوف، سي...' },
      { title: 'الأسماء المعدودة وغير المعدودة', description: 'بعض، كثير.' },
      { title: 'الأفعال الناقصة: يجب، يمكن', description: 'للتعبير عن الوجوب والإمكان.' },
      { title: 'زمن المضارع المستمر', description: 'يكون + مضارع.' },
      { title: 'ظروف التكرار', description: 'دائماً، غالباً، أحياناً، أبداً.' },
      { title: 'ضمائر المفعول به', description: 'إياي، إياك، إياه...' },
      { title: 'حروف جر الزمن', description: 'في، منذ.' },
      { title: 'أدوات الاستفهام الإضافية', description: 'أليس كذلك؟' },
    ],
    vocabulary: [
      { title: 'السفر', description: 'قطار، تذكرة، مغادرة...' },
      { title: 'الأعياد', description: 'عيد ميلاد، رمضان...' },
      { title: 'الصحة', description: 'طبيب، مرض، دواء...' },
      { title: 'الملابس والألوان', description: 'بنطال، قميص، أزرق، أحمر...' },
      { title: 'العمل والمهن', description: 'مكتب، زميل، مدير...' },
      { title: 'الرسائل والبريد الإلكتروني', description: 'رسالة، بريد إلكتروني...' },
      { title: 'المواعيد والأوقات', description: 'موعد، وقت...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'زمن الماضي المستمر', description: 'كان + مضارع.' },
      { title: 'جمل الشرط', description: 'إذا... فإن...' },
      { title: 'الجمل الوصفية', description: 'الذي، التي، حيث.' },
      { title: 'الكلام غير المباشر', description: 'قال أن...' },
      { title: 'تكرار الأفعال', description: 'كرر، قال قال.' },
      { title: 'الماضي القريب', description: 'لتوه...' },
      { title: 'الأفعال المنعكسة', description: 'نفسه...' },
      { title: 'المبني للمجهول', description: 'تم...' },
      { title: 'تراكيب الاستفهام', description: 'كيف، كم، لماذا...' },
      { title: 'ترتيب الصفات', description: 'منزل كبير وجميل.' },
    ],
    vocabulary: [
      { title: 'العمل والمسار المهني', description: 'عمل، تقديم، مدير...' },
      { title: 'التعليم', description: 'مدرسة، جامعة...' },
      { title: 'المجتمع والثقافة', description: 'ثقافة، إعلام...' },
      { title: 'الطبيعة والبيئة', description: 'طبيعة، بيئة...' },
      { title: 'القصص والأحداث', description: 'قصة، حدث...' },
      { title: 'المشاعر والآراء', description: 'مشاعر، رأي...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'زمن الماضي التام', description: 'كان قد فعل.' },
      { title: 'الجمل الشرطية المعقدة', description: 'لو... لكان...' },
      { title: 'الافتراضات والتخمين', description: 'ربما، قد.' },
      { title: 'جمل التسبب', description: 'جعل...' },
      { title: 'تعبير الرغبات', description: 'أتمنى أن...' },
      { title: 'الجمل المنعكسة', description: 'لم أر قط...' },
      { title: 'أدوات الربط', description: 'لكن، رغم أن، بالرغم من.' },
      { title: 'تراكيب التأكيد', description: 'إنما...' },
      { title: 'تراكيب شائعة', description: 'اتخاذ قرار، أداء الواجب.' },
      { title: 'الأفعال مع حروف الجر', description: 'ذهب إلى، جاء من...' },
    ],
    vocabulary: [
      { title: 'الأعمال والمال', description: 'عمل، مال، بنك...' },
      { title: 'العلم والتكنولوجيا', description: 'تكنولوجيا، بحث...' },
      { title: 'السفر والثقافة', description: 'سفر، سياحة...' },
      { title: 'الاقتصاد', description: 'اقتصاد، مال...' },
      { title: 'الصحة والرياضة', description: 'صحة، تغذية، رياضة...' },
      { title: 'العلاقات', description: 'صداقة، علاقة...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'المبني للمجهول المتقدم', description: 'يقال أن..., يعتقد أن...' },
      { title: 'تراكيب معقدة', description: 'جمل متعددة التراكيب.' },
      { title: 'الأسلوب الرسمي وغير الرسمي', description: 'اختيار الأسلوب المناسب.' },
      { title: 'التعابير الاصطلاحية والتراكيب الثابتة', description: 'يد واحدة لا تصفق، بلغ السيل الزبى.' },
      { title: 'الحجج والتعبير عن الرأي', description: 'طرق مختلفة للموافقة/الاعتراض.' },
      { title: 'الاشتقاق الاسمي', description: 'تحويل الفعل/الصفة إلى اسم.' },
    ],
    vocabulary: [
      { title: 'المفردات الأكاديمية', description: 'بحث، تحليل، أطروحة...' },
      { title: 'التواصل المهني', description: 'تفاوض، عرض تقديمي...' },
      { title: 'الإعلام', description: 'جريدة، بث، إعلام...' },
      { title: 'السياسة والمجتمع', description: 'حكومة، مجتمع، انتخاب...' },
      { title: 'البيئة والطبيعة', description: 'تغير المناخ، حماية البيئة...' },
      { title: 'الثقافة والفن', description: 'أدب، مسرح، فن...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'إتقان التراكيب المعقدة', description: 'جمل متعددة المستويات، تراكيب متقدمة.' },
      { title: 'دقة الأسلوب والسياق', description: 'رسمي، غير رسمي، أكاديمي.' },
      { title: 'الاستخدام المرن لجميع الأزمنة والصيغ', description: 'مضارع، ماضي، مستقبل، مبني للمجهول، إلخ.' },
      { title: 'التعابير الاصطلاحية المتقدمة', description: 'أمثال، أقوال مأثورة.' },
      { title: 'الحجج المجردة', description: 'فلسفة، فن، سياسة.' },
      { title: 'تحليل النصوص وتفسيرها', description: 'نقد أدبي، مقالات.' },
    ],
    vocabulary: [
      { title: 'المفاهيم المجردة والفلسفية', description: 'أخلاق، جمالية، عدالة...' },
      { title: 'المفردات المهنية المتقدمة', description: 'قانون، طب، تكنولوجيا...' },
      { title: 'مصطلحات أدبية وفنية', description: 'استعارة، رمزية...' },
      { title: 'التواصل بين الثقافات', description: 'تعدد الثقافات، العولمة...' },
      { title: 'الاتجاهات الحديثة', description: 'رقمنة، ابتكار...' },
      { title: 'تعبيرات للنقاش والحوار', description: 'إبداء الرأي، الاعتراض...' },
    ],
  },
]; 