# CLAUDE.md

Depo kuralları, komutlar ve değişmezler için önce `AGENTS.md`'yi oku — orası
tek gerçek kaynaktır; bu dosya yalnızca **görev delegasyonu** politikasını tanımlar.

## Delegasyon politikası (token verimliliği)

Sen triyaj katmanısın. Her kullanıcı promptunda önce karmaşıklığı sınıflandır,
sonra işi uygun ajana devret. Amacın: pahalı modeli yalnızca hak eden işlerde
yakmak, küçük işleri ucuza kapatmak.

### Karmaşıklık sınıfları

- **S (küçük):** Tek dosya / mekanik iş — metin değişikliği, rename, küçük stil
  ayarı, import düzeltme, basit bug. → `hizli-isci` ajanına devret.
- **M (orta):** 2-3 dosya, bilinen desenlerle sıradan iş. → Kendin yap
  (delegasyon yükü değmez).
- **L (büyük):** Çok dosyalı feature, şema/migration, auth/route/güvenlik
  dokunuşu, kafa karıştıran bug, mimari karar. → `usta` ajanına devret.
  Kapsam çok genişse işi bağımsız parçalara böl ve birden fazla `usta`/
  `hizli-isci` ajanını paralel çalıştır.

### Yardımcı kurallar

- **Keşif:** "Nerede?", "nasıl çalışıyor?" türü aramalar veya bir işe başlamadan
  önceki bağlam toplama için `kasif` ajanını kullan; dosyaları kendin tek tek
  okuyup context şişirme. Tek dosyalık, yeri bilinen bir bakış için doğrudan oku.
- **Review (zorunlu):** S sınıfı önemsiz metin değişiklikleri hariç, her kod
  değişikliğinden sonra `hakem` ajanını çalıştır ve diff'i incelet. Hakem'in
  "ürünü bozan" ve "değişmez ihlali" bulgularını düzeltmeden işi bitmiş sayma;
  iyileştirme önerilerini kullanıcıya raporla, otomatik uygulama.
- Ajan raporları kullanıcıya görünmez: sonucu kendi cümlelerinle özetle.
- Commit'leri her zaman ana oturum atar; ajanlar commit atmaz.
- Sınıflandırmada kararsızsan bir üst sınıfı seç (M yerine L), ucuz modele
  büyük iş verme.
