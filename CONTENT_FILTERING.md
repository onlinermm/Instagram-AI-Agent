# Покращена фільтрація контенту за релевантністю до нерухомості

## Огляд

Система фільтрації контенту використовує штучний інтелект для аналізу **кількох постів та рілів** в Instagram профілі, щоб визначити найбільш релевантний контент до сфери нерухомості. Це дозволяє уникнути взаємодії з неподходящими постами та **автоматично вибирати найкращий контент** для взаємодії.

## Нові можливості (v2.0)

### 🔍 Аналіз кількох постів
- Аналізує до **5 постів/рілів** з профілю замість одного
- Порівнює оцінки релевантності та вибирає найкращий
- Логує детальну інформацію про кожен проаналізований пост

### 🎯 Розумний вибір контенту
- Сортує контент за оцінкою релевантності (0-100)
- Автоматично вибирає пост з найвищою оцінкою
- Пропускає профіль тільки якщо **жоден** пост не релевантний

### 🖼️ Підготовка до аналізу зображень
- Додана функція `analyzeImageRelevance()` для майбутнього використання
- Готовність до інтеграції з Gemini Vision API
- Можливість аналізувати візуальний контент нерухомості

## Як це працює

1. **Збір посилань**: Система збирає до 8 унікальних постів/рілів з профілю
2. **Аналіз контенту**: Аналізує до 5 постів для визначення релевантності
3. **Витягування описів**: Отримує текст опису з кожного поста/рілу
4. **ШІ аналіз**: Використовує Gemini AI для оцінки релевантності (0-100)
5. **Вибір найкращого**: Сортує за оцінкою та вибирає найрелевантніший
6. **Взаємодія**: Відкриває обраний пост для лайків/коментарів

## Логування покращеного процесу

```
🔍 Collecting post and reel links...
Found 6 unique posts/reels for analysis
🔍 Analyzing post 1/5: https://www.instagram.com/p/ABC123/
📊 Post analysis: Score=85, Relevant=true, Category=residential
📝 Reason: Post discusses apartment sale and investment opportunities
🔍 Analyzing reel 2/5: https://www.instagram.com/reel/DEF456/
📊 Reel analysis: Score=25, Relevant=false, Category=not_relevant
📝 Reason: Content about family vacation, not related to real estate
...
✅ Selected best content: post with score 85
📝 Selection reason: Post discusses apartment sale and investment opportunities
✅ Opening best relevant post (Score: 85)
✅ Proceeding with interaction - Content relevance score: 85
```

## Конфігурація

### Основні налаштування в `src/config/interaction.json`:

```json
{
  "features": {
    "contentFiltering": true  // Увімкнути/вимкнути фільтрацію
  },
  "contentFilter": {
    "minRelevanceScore": 70,  // Мінімальна оцінка релевантності (0-100)
    "allowedCategories": [    // Дозволені категорії
      "residential",
      "commercial", 
      "investment",
      "rental",
      "construction",
      "renovation",
      "market_analysis"
    ],
    "requiredKeywords": [],   // Обов'язкові ключові слова (поки не використовується)
    "excludeKeywords": [      // Виключені ключові слова
      "family",
      "vacation",
      "food",
      "entertainment",
      "personal",
      "hobby",
      "travel",
      "fashion",
      "beauty",
      "sports"
    ]
  }
}
```

## Категорії контенту

- **residential** - Житлова нерухомість
- **commercial** - Комерційна нерухомість  
- **investment** - Інвестиційні можливості
- **rental** - Оренда
- **construction** - Будівництво
- **renovation** - Ремонт та реновація
- **market_analysis** - Аналіз ринку
- **not_relevant** - Нерелевантний контент

## Ключові слова

### Включені (релевантні):
- property, house, home, apartment, condo, villa
- office, commercial, residential, investment
- rent, buy, sell, mortgage, realtor, agent, broker
- construction, renovation, interior, design, architecture
- market, value, location, neighborhood
- недвижимость, нерухомість, квартира, дом
- продажа, аренда, покупка, риелтор, агент

### Виключені (нерелевантні):
- family, vacation, food, entertainment, personal
- hobby, travel, fashion, beauty, sports, gaming
- music, party, celebration

## Логіка фільтрації

1. **Перевірка виключених слів**: Якщо знайдено виключені ключові слова → контент відхиляється
2. **ШІ аналіз**: Gemini аналізує контент та присвоює оцінку
3. **Перевірка оцінки**: Оцінка повинна бути >= `minRelevanceScore`
4. **Перевірка категорії**: Категорія повинна бути в списку `allowedCategories`
5. **Фінальне рішення**: Всі умови повинні виконуватися для взаємодії

## Тестування

Запустіть тест фільтрації контенту:

```bash
npm run test:content-filter
# або
npx ts-node src/test/contentFilterTest.ts
```

## Налаштування для різних сценаріїв

### Строга фільтрація (тільки явно релевантний контент):
```json
{
  "minRelevanceScore": 80,
  "allowedCategories": ["residential", "commercial", "investment"]
}
```

### М'яка фільтрація (більше контенту):
```json
{
  "minRelevanceScore": 50,
  "allowedCategories": ["residential", "commercial", "investment", "rental", "construction", "renovation", "market_analysis"]
}
```

### Вимкнення фільтрації:
```json
{
  "features": {
    "contentFiltering": false
  }
}
```

## Переваги

1. **Точність**: ШІ аналіз забезпечує високу точність визначення релевантності
2. **Гнучкість**: Легко налаштовувані параметри фільтрації
3. **Багатомовність**: Підтримка української, російської та англійської мов
4. **Продуктивність**: Швидкий аналіз без затримок
5. **Логування**: Детальні логи для моніторингу та налагодження

## Обмеження

1. Залежність від якості опису поста
2. Потребує API ключ для Gemini AI
3. Може іноді помилково класифікувати граничні випадки

## Підтримка

При виникненні проблем перевірте:
1. Чи правильно налаштований Gemini API ключ
2. Чи увімкнена фільтрація в конфігурації
3. Чи відповідають налаштування вашим потребам
4. Логи для діагностики проблем 