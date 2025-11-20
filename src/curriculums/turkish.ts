// Структурированный учебный план для турецкого языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const turkishCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: 'Kişi zamirleri ve "olmak" fiili', description: 'ben, sen, o, biz, siz, onlar; olmak (im, sin, dir, iz, siniz, dirler).' },
      { title: 'Şimdiki zaman fiilleri', description: 'Düzenli fiil çekimleri.' },
      { title: 'İsimlerin tekil ve çoğul halleri', description: '-ler/-lar ekleri.' },
      { title: 'Olumsuz cümleler', description: 'değil, yok.' },
      { title: 'Soru cümleleri', description: 'mi, ne, kim, nerede.' },
      { title: 'Temel edatlar', description: 'içinde, üstünde, altında, önünde, arkasında.' },
      { title: 'Zaman ifadeleri', description: 'bugün, yarın, dün.' },
      { title: 'Sayılar', description: 'bir, iki, üç...' },
      { title: 'Sıfatların temel kullanımı', description: 'büyük, küçük, iyi, kötü.' },
      { title: 'Temel ifadeler', description: 'var, yok, olabilir.' },
    ],
    vocabulary: [
      { title: 'Selamlaşma ve tanışma', description: 'Merhaba, Hoşça kal, Benim adım...' },
      { title: 'Aile', description: 'Anne, baba, kardeş...' },
      { title: 'Sayılar', description: 'bir, iki, üç...' },
      { title: 'Meslekler', description: 'Öğretmen, doktor, öğrenci...' },
      { title: 'Yiyecek ve içecekler', description: 'Ekmek, su, elma...' },
      { title: 'Hava durumu', description: 'Güneşli, yağmurlu, karlı...' },
      { title: 'Günler ve aylar', description: 'Pazartesi, Ocak...' },
      { title: 'Şehir ve ulaşım', description: 'Otobüs, istasyon, cadde...' },
      { title: 'Ev ve mobilya', description: 'Masa, sandalye, oda...' },
      { title: 'Alışveriş', description: 'Almak, fiyat, süpermarket...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: 'Karşılaştırma ve üstünlük', description: 'daha... -den, en...' },
      { title: 'Geçmiş zaman', description: '-di, -miş, -dı.' },
      { title: 'Gelecek zaman', description: '-ecek, -acak.' },
      { title: 'Sayılabilir ve sayılamaz isimler', description: 'birkaç, çok.' },
      { title: 'Modal fiiller: zorunda olmak, -ebilmek', description: 'Gereklilik ve olasılık.' },
      { title: 'Şimdiki zamanın hikayesi', description: '-yor idi.' },
      { title: 'Sıklık zarfları', description: 'her zaman, sık sık, bazen, asla.' },
      { title: 'Nesne zamirleri', description: 'beni, seni, onu, bizi, sizi, onları.' },
      { title: 'Zaman edatları', description: 'de, -de, -den beri.' },
      { title: 'Soru ekleri', description: 'değil mi?' },
    ],
    vocabulary: [
      { title: 'Seyahat', description: 'Tren, bilet, gitmek...' },
      { title: 'Bayramlar', description: 'Doğum günü, Ramazan...' },
      { title: 'Sağlık', description: 'Doktor, hastalık, ilaç...' },
      { title: 'Kıyafetler ve renkler', description: 'Pantolon, gömlek, mavi, kırmızı...' },
      { title: 'İş ve meslekler', description: 'Ofis, meslektaş, patron...' },
      { title: 'Mektuplar ve e-postalar', description: 'Mektup, e-posta...' },
      { title: 'Saatler ve randevular', description: 'Randevu, saat...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: 'Sürekli geçmiş zaman', description: '-yordu.' },
      { title: 'Koşul cümleleri', description: 'Eğer... ise...' },
      { title: 'İlgi zamirleri', description: 'ki, kim, ne, nerede.' },
      { title: 'Dolaylı anlatım', description: 'Dedi ki...' },
      { title: 'Fiil tekrarları', description: 'bakmak bakmak, söylemek söylemek.' },
      { title: 'Yakın geçmiş', description: 'henüz...' },
      { title: 'Dönüşlü fiiller', description: 'kendi...' },
      { title: 'Edilgen yapı', description: '-lmek.' },
      { title: 'Soru yapıları', description: 'nasıl, kaç, neden...' },
      { title: 'Sıfat sırası', description: 'büyük ve güzel ev.' },
    ],
    vocabulary: [
      { title: 'İş ve kariyer', description: 'İş, başvuru, patron...' },
      { title: 'Eğitim', description: 'Okul, üniversite...' },
      { title: 'Toplum ve kültür', description: 'Kültür, medya...' },
      { title: 'Doğa ve çevre', description: 'Doğa, çevre...' },
      { title: 'Hikayeler ve olaylar', description: 'Hikaye, olay...' },
      { title: 'Duygular ve görüşler', description: 'Duygu, görüş...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: 'Daha önceki geçmiş zaman', description: '-mişti.' },
      { title: 'Şart kipi', description: 'Eğer... olsaydı...' },
      { title: 'Varsayım ve tahmin', description: 'belki, muhtemelen.' },
      { title: 'Ettirgen yapı', description: '-dir(t)mek.' },
      { title: 'Dilek ve istek', description: 'istemek, ummak.' },
      { title: 'Devrik cümleler', description: 'Hiç görmedim...' },
      { title: 'Bağlaçlar', description: 'ancak, fakat, rağmen.' },
      { title: 'Vurgu yapıları', description: '... olan ...' },
      { title: 'Kalıplaşmış ifadeler', description: 'karar vermek, ödev yapmak.' },
      { title: 'Fiil+edat birleşimi', description: 'çıkmak, gitmek...' },
    ],
    vocabulary: [
      { title: 'İş dünyası ve finans', description: 'İş, para, banka...' },
      { title: 'Bilim ve teknoloji', description: 'Teknoloji, araştırma...' },
      { title: 'Seyahat ve kültür', description: 'Seyahat, turizm...' },
      { title: 'Ekonomi', description: 'Ekonomi, finans...' },
      { title: 'Sağlık ve spor', description: 'Sağlık, beslenme, spor...' },
      { title: 'İlişkiler', description: 'Dostluk, ilişki...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: 'Gelişmiş edilgen yapı', description: 'denir ki..., düşünülür ki...' },
      { title: 'Karmaşık cümle yapıları', description: 'Birden fazla yan cümle.' },
      { title: 'Resmi ve gayriresmi dil', description: 'Duruma uygun stil.' },
      { title: 'Deyimler ve sabit ifadeler', description: 'Kulağı delik, gözden düşmek.' },
      { title: 'Tartışma ve görüş bildirme', description: 'Farklı şekillerde katılmak/katılmamak.' },
      { title: 'İsimleşme', description: 'Fiil/sıfat isim yapmak.' },
    ],
    vocabulary: [
      { title: 'Akademik kelime dağarcığı', description: 'Araştırma, analiz, tez...' },
      { title: 'Profesyonel iletişim', description: 'Müzakere, sunum...' },
      { title: 'Medya', description: 'Gazete, yayın, medya...' },
      { title: 'Politika ve toplum', description: 'Hükümet, toplum, seçim...' },
      { title: 'Ekoloji ve çevre', description: 'İklim değişikliği, çevre koruma...' },
      { title: 'Kültür ve sanat', description: 'Edebiyat, tiyatro, sanat...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: 'Karmaşık yapıların ustalığı', description: 'Çok katmanlı cümleler, ileri düzey yapılar.' },
      { title: 'Stil ve dilin incelikleri', description: 'Resmi, gayriresmi, akademik.' },
      { title: 'Tüm zaman ve çatıların esnek kullanımı', description: 'Şimdiki, geçmiş, gelecek, edilgen vs.' },
      { title: 'Gelişmiş deyimler ve atasözleri', description: 'Atasözleri, deyimler.' },
      { title: 'Soyut tartışma', description: 'Felsefe, sanat, politika.' },
      { title: 'Metin analizi ve yorumlama', description: 'Edebiyat eleştirisi, denemeler.' },
    ],
    vocabulary: [
      { title: 'Soyut ve felsefi kavramlar', description: 'Etik, estetik, adalet...' },
      { title: 'Yüksek düzeyde mesleki kelime dağarcığı', description: 'Hukuk, tıp, teknoloji...' },
      { title: 'Edebi ve sanatsal terimler', description: 'Metafor, sembolizm...' },
      { title: 'Kültürlerarası iletişim', description: 'Kültürlerarası, küreselleşme...' },
      { title: 'Modern eğilimler', description: 'Dijitalleşme, yenilik...' },
      { title: 'Tartışma ve münazara ifadeleri', description: 'Fikir belirtmek, karşı çıkmak...' },
    ],
  },
]; 
