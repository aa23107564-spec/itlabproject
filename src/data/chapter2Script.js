/**
 * 章節二劇本數據
 * 完全按照原始劇本，已刪除所有引號「」
 */

const chapter2Script = {
  // 開場
  opening: [
    {
      id: 'opening-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我想寫一般的那種小說。',
      next: 'opening-2'
    },
    {
      id: 'opening-2',
      type: 'dialogue',
      speaker: 'editor',
      text: '......你指的一般是，既不科幻也不意識流的那種嗎？',
      next: 'opening-3'
    },
    {
      id: 'opening-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '對。就是那種，最普通最普通的故事，\n即使是最普通的人都能對它產生共鳴的那種故事。',
      next: 'opening-4'
    },
    {
      id: 'opening-4',
      type: 'dialogue',
      speaker: 'editor',
      text: '不行。',
      next: 'opening-5'
    },
    {
      id: 'opening-5',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '......',
      next: 'opening-5-animation'
    },
    {
      id: 'opening-5-animation',
      type: 'animation',
      animationType: 'drinkCoffee',
      duration: 2500,
      next: 'opening-6'
    },
    {
      id: 'opening-6',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '......',
      next: 'opening-7'
    },
    {
      id: 'opening-7',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '因為我一定要不普通才行嗎？',
      next: 'opening-8'
    },
    {
      id: 'opening-8',
      type: 'dialogue',
      speaker: 'editor',
      text: '倒也沒那回事。',
      next: 'opening-9'
    },
    {
      id: 'opening-9',
      type: 'dialogue',
      speaker: 'editor',
      text: '但是，你明白嗎？\n擁有只屬於自己世界，\n再把它毫無保留地丟到別人眼前——',
      next: 'opening-10'
    },
    {
      id: 'opening-10',
      type: 'dialogue',
      speaker: 'editor',
      text: '這種事情不是每個人都能做到的。',
      next: 'choice-1'
    },
    {
      id: 'choice-1',
      type: 'choice',
      choices: [
        {
          text: '【選項a：明白】',
          next: 'branch-a-understand'
        },
        {
          text: '【選項b：不明白】',
          next: 'branch-b-not-understand'
        }
      ]
    }
  ],

  // 分支 A：明白
  'branch-a-understand': [
    {
      id: 'branch-a-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我知道，這是我的天職，對吧？',
      next: 'branch-a-2'
    },
    {
      id: 'branch-a-2',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '因為那些不普通，我讓別人看到我，\n也讓我聽到別人口中我的樣子。',
      next: 'branch-a-3'
    },
    {
      id: 'branch-a-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '可是對我自己來說，我到底是什麼？',
      next: 'branch-a-4'
    },
    {
      id: 'branch-a-4',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我看不清我的樣子，\n我想用我自己的雙眼看清楚我是什麼。',
      next: 'branch-a-5'
    },
    {
      id: 'branch-a-5',
      type: 'dialogue',
      speaker: 'editor',
      text: '<slow>......</slow>難道你以為你寫了一個普通的故事，\n就會得到一雙普通的眼睛嗎？',
      next: 'branch-a-6'
    },
    {
      id: 'branch-a-6',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>...</slow>不試試看怎麼知道？',
      next: 'branch-a-7'
    },
    {
      id: 'branch-a-7',
      type: 'dialogue',
      speaker: 'editor',
      text: '好吧，那你說說看，\n對你來說，「普通」到底是什麼？',
      next: 'branch-a-8'
    },
    {
      id: 'branch-a-8',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>普通人......</slow>大概照著鏡子的時候，\n都能理所當然地相信自己確實和鏡中的那個人長得是一樣的吧。',
      next: 'branch-a-9'
    },
    {
      id: 'branch-a-9',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '因為他記得鏡子裡自己的模樣，\n所以不管是獨處還是出門在外，\n都不會沒辦法確定自己到底在哪裡、在和誰對話。',
      next: 'branch-a-10'
    },
    {
      id: 'branch-a-10',
      type: 'dialogue',
      speaker: 'editor',
      text: '其實你現在不是也很清楚嗎？\n知道自己正在咖啡廳，和你的編輯<slow>討論著下本書的事......</slow>',
      next: 'branch-a-11'
    },
    {
      id: 'branch-a-11',
      type: 'dialogue',
      speaker: 'editor',
      text: '難道這些事不從別人的嘴裡聽到，\n你..<slow>.就沒辦法知道嗎？</slow>',
      next: 'branch-a-12'
    },
    {
      id: 'branch-a-12',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<strong>知道是知道！</strong>我現在是知道的，',
      next: 'branch-a-13'
    },
    {
      id: 'branch-a-13',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '但是只要一離開現在，這些事我就再也沒有自信確定了。',
      next: 'branch-a-14'
    },
    {
      id: 'branch-a-14',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '寫科幻讓我很有安全感，\n因為我不必去確定那些設定和世界觀\n到底是不是真的發生過，或是真的會發生。',
      next: 'branch-a-15'
    },
    {
      id: 'branch-a-15',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我曾經也很篤定這是屬於我的路，\n但是<slow>......</slow>安全感真的是我該一輩子抓著不放的東西嗎？',
      next: 'branch-a-16'
    },
    {
      id: 'branch-a-16',
      type: 'dialogue',
      speaker: 'editor',
      text: '你也不用想得這麼複雜吧。\n至少這件事確實就是只有你能做，',
      next: 'branch-a-17'
    },
    {
      id: 'branch-a-17',
      type: 'dialogue',
      speaker: 'editor',
      text: '這樣難道還不足以說服你，這就是<slow><strong>獨一無二的「你」</strong></slow>嗎？',
      next: 'branch-a-18'
    },
    {
      id: 'branch-a-18',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '對，我是「新科幻派」，我是「意識流寫作大師」，我是「小眾」。\n我以為這些就是我的全部。',
      next: 'branch-a-19'
    },
    {
      id: 'branch-a-19',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '但是，這些只是我「聽到的」我，\n我到底要怎麼「看到」我？',
      next: 'branch-a-20'
    },
    {
      id: 'branch-a-20',
      type: 'dialogue',
      speaker: 'editor',
      text: '<slow>......</slow>好吧，那你就去看看吧，去看看你自己。',
      next: 'branch-a-21'
    },
    {
      id: 'branch-a-21',
      type: 'dialogue',
      speaker: 'editor',
      text: '但是我必須說，我一直都看著你，所以我有自信，',
      next: 'branch-a-22'
    },
    {
      id: 'branch-a-22',
      type: 'dialogue',
      speaker: 'editor',
      text: ' 我所看見的你，就是你一直掛在嘴邊的「自己」。',
      next: 'choice-2-a'
    },
    {
      id: 'choice-2-a',
      type: 'choice',
      choices: [
        {
          text: '【選項a 我會證明給你看】',
          next: 'ending-a-a'
        },
        {
          text: '【選項b 為什麼你能有自信這樣說？】',
          next: 'ending-a-b'
        }
      ]
    }
  ],

  // 分支 B：不明白
  'branch-b-not-understand': [
    {
      id: 'branch-b-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我不明白，其實我從來沒聽懂你說的那些到底是什麼意思......',
      next: 'branch-b-2'
    },
    {
      id: 'branch-b-2',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我明明只是把我看到的都寫下來而已啊！',
      className: 'shout-effect',
      next: 'branch-b-3'
    },
    {
      id: 'branch-b-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '那些我記得我看到的，和我不記得我看到的，全部都寫下來。',
      next: 'branch-b-4'
    },
    {
      id: 'branch-b-4',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '這樣的我<slow>...<strong>難道不能</slow>被稱作是一個『普通人』嗎？</strong>',
      next: 'branch-b-5'
    },
    {
      id: 'branch-b-5',
      type: 'dialogue',
      speaker: 'editor',
      text: '......',
      next: 'branch-b-6'
    },
    {
      id: 'branch-b-6',
      type: 'dialogue',
      speaker: 'editor',
      text: '我從沒說過你不是普通人啊。',
      next: 'branch-b-7'
    },
    {
      id: 'branch-b-7',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>那為什麼...</slow><strong>我不能寫一個普通的故事！</strong>',
      next: 'branch-b-8'
    },
    {
      id: 'branch-b-8',
      type: 'dialogue',
      speaker: 'editor',
      text: '因為你所配有的視覺感官，如果只是「一頭」栽在普通上，就太可惜了。',
      next: 'branch-b-9'
    },
    {
      id: 'branch-b-9',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>......</slow>只因為我能看到的比別人多，即使普通才是我想要的，\n我也沒有權利去普通地看見些什麼嗎？',
      next: 'branch-b-10'
    },
    {
      id: 'branch-b-10',
      type: 'dialogue',
      speaker: 'editor',
      text: '並不是沒有權利，而是<slow>你沒有這種能力。</slow>',
      next: 'branch-b-11'
    },
    {
      id: 'branch-b-11',
      type: 'dialogue',
      speaker: 'editor',
      text: '舉例來說好了，你所看到的正在你眼前的我，是什麼模樣？形容看看吧。',
      next: 'branch-b-12'
    },
    {
      id: 'branch-b-12',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '就是<slow>......</slow>很普通啊！\n有眼睛、有嘴巴、有<slow>......</slow>鼻子！對！有鼻子！就是這樣。',
      next: 'branch-b-13'
    },
    {
      id: 'branch-b-13',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '......',
      next: 'branch-b-14'
    },
    {
      id: 'branch-b-14',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '對了！還有眉毛吧！',
      next: 'branch-b-15'
    },
    {
      id: 'branch-b-15',
      type: 'dialogue',
      speaker: 'editor',
      text: '你確定<slow>你所看到的真的是這樣子嗎？</slow>',
      next: 'branch-b-16'
    },
    {
      id: 'branch-b-16',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<strong>當然了！</strong>',
      next: 'branch-b-17'
    },
    {
      id: 'branch-b-17',
      type: 'dialogue',
      speaker: 'editor',
      text: '那你現在形容看看，我的鼻子<slow>是高挺還是扁塌</slow>、嘴唇<slow>是乾燥還是濕潤</slow>、還有<slow>...</slow>我的眼睛<slow>是細長還是圓潤</slow>。',
      next: 'branch-b-18'
    },
    {
      id: 'branch-b-18',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '......',
      next: 'branch-b-19'
    },
    {
      id: 'branch-b-19',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我不知道啦！',
      next: 'branch-b-20'
    },
    {
      id: 'branch-b-20',
      type: 'dialogue',
      speaker: 'editor',
      text: '在《窮舉的止盡》裡你寫道：\n「每天照著鏡子，我只看到一塊塊橘褐色色塊的組合，\n這些色塊隨時明暗都在變化，有時色塊與色塊之間涇渭分明，」',
      next: 'branch-b-21'
    },
    {
      id: 'branch-b-21',
      type: 'dialogue',
      speaker: 'editor',
      text: '「有時卻像是洗筆筒中被廢顏料粒子打亂的水分子集合體，\n他們不停打轉、旋轉，彷彿在這樣盯下去自己的存在都要被吸入、嚥入。」',
      next: 'branch-b-22'
    },
    {
      id: 'branch-b-22',
      type: 'dialogue',
      speaker: 'editor',
      text: '「我的臉孔和隔壁鄰居的臉、所有人的臉都一樣，缺乏特徵，\n不由得想到，那種只在小時候家政課揉過一次的麵團，\n質地不良且色彩不鮮，看了毫無食慾。」',
      next: 'branch-b-23'
    },
    {
      id: 'branch-b-23',
      type: 'dialogue',
      speaker: 'editor',
      text: '總而言之我想說的是，我是你的編輯啊！我怎麼會不知道你看得到什麼、看不到什麼？',
      next: 'branch-b-24'
    },
    {
      id: 'branch-b-24',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '...好吧，你很懂我。\n那你倒是說說看，為什麼明明照了鏡子，我還是看不到我自己？',
      next: 'branch-b-25'
    },
    {
      id: 'branch-b-25',
      type: 'dialogue',
      speaker: 'editor',
      text: '沒有人能看見自己，好嗎？\n難道你以為我看得見我自己嗎？',
      next: 'branch-b-26'
    },
    {
      id: 'branch-b-26',
      type: 'dialogue',
      speaker: 'editor',
      text: '人們之所以喜歡故事，就是因為沒有人能看得見自己。',
      next: 'branch-b-27'
    },
     {
      id: 'branch-b-27',
      type: 'dialogue',
      speaker: 'editor',
      text: '這種恐慌我們一輩子都無法擺脫，只有在故事中全神貫注的凝視他人，才能夠暫時忘記。',
      next: 'branch-b-28'
    },
    {
      id: 'branch-b-28',
      type: 'dialogue',
      speaker: 'editor',
      text: '而你的故事之所以獨特，\n就是你讓人們在你所再現的視覺噪音中，暫時失明獲得了安慰。',
      next: 'branch-b-29'
    },
    {
      id: 'branch-b-29',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '那麼我又該從何處得到安慰呢？',
      next: 'branch-b-30'
    },
    {
      id: 'branch-b-30',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '現在你也能明白我為什麼想寫一個普通的故事了吧？',
      next: 'branch-b-31'
    },
    {
      id: 'branch-b-31',
      type: 'dialogue',
      speaker: 'editor',
      text: '好，那你閉上眼吧。如果你想寫出普通，那就去寫吧！',
      next: 'branch-b-32'
    },
    {
      id: 'branch-b-32',
      type: 'dialogue',
      speaker: 'editor',
      text: '等到最後你會發現，那並不是你該追求的方向。',
      next: 'choice-2-b'
    },
    {
      id: 'choice-2-b',
      type: 'choice',
      choices: [
        {
          text: '【選項a：閉眼】',
          next: 'ending-b-a'
        },
        {
          text: '【選項b：不閉眼】',
          next: 'ending-b-b'
        }
      ]
    }
  ],

  // 結局 A-A：我會證明給你看
  'ending-a-a': [
    {
      id: 'ending-a-a-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '......',
      next: 'ending-a-a-2'
    },
    {
      id: 'ending-a-a-2',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我會證明給你看，你一直說的那個我根本不是我。',
      next: 'ending-a-a-3'
    },
    {
      id: 'ending-a-a-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '至少現在我也有自信跟你這樣說。',
      next: 'end'
    }
  ],

  // 結局 A-B：為什麼你能有自信這樣說？
  'ending-a-b': [
    {
      id: 'ending-a-b-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '為什麼你能有自信這樣說？',
      next: 'ending-a-b-2'
    },
    {
      id: 'ending-a-b-2',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>...</slow>難道你不相信我剛剛說的那些嗎？',
      next: 'ending-a-b-3'
    },
    {
      id: 'ending-a-b-3',
      type: 'dialogue',
      speaker: 'editor',
      text: '我當然相信。\n但是我比你早知道了一件事，',
      next: 'ending-a-b-4'
    },
    {
      id: 'ending-a-b-4',
      type: 'dialogue',
      speaker: 'editor',
      text: '一件你現在還無法相信的事。',
      next: 'ending-a-b-5'
    },
    {
      id: 'ending-a-b-5',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>什麼事？</slow>',
      next: 'ending-a-b-6'
    },
    {
      id: 'ending-a-b-6',
      type: 'dialogue',
      speaker: 'editor',
      text: '不只是你，我們所有人，都<slow>並沒有什麼自己的眼睛</slow>。\n<slow><strong>我的眼睛就是你的眼睛。</strong></slow>',
      next: 'ending-a-b-7'
    },
    {
      id: 'ending-a-b-7',
      type: 'dialogue',
      speaker: 'editor',
      text: '或許你看到的我，\n是<strong>「一團質地不良且色彩不鮮，\n讓人看了毫無食慾的麵團」</strong>。',
      next: 'ending-a-b-8'
    },
    {
      id: 'ending-a-b-8',
      type: 'dialogue',
      speaker: 'editor',
      text: '但是我知道，\n那一定就是我沒有錯。',
      next: 'ending-a-b-9'
    },
    {
      id: 'ending-a-b-9',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>......</slow>為什麼啊？',
      next: 'ending-a-b-10'
    },
    {
      id: 'ending-a-b-10',
      type: 'dialogue',
      speaker: 'editor',
      text: '沒有為什麼。\n總有一天你會明白的。',
      next: 'ending-a-b-11'
    },
    {
      id: 'ending-a-b-11',
      type: 'dialogue',
      speaker: 'editor',
      text: '不論看得多還是看得少，\n看得簡單還是看得複雜，\n不論視覺能不能建構可信的記憶，',
      next: 'ending-a-b-12'
    },
    {
      id: 'ending-a-b-12',
      type: 'dialogue',
      speaker: 'editor',
      text: '想透過自己的眼睛看見自己這種事，\n只要是人，<slow>都是無能為力的。</slow>',
      next: 'ending-a-b-13'
    },
    {
      id: 'ending-a-b-13',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<slow>......</slow>我不想接受這種說法。',
      next: 'ending-a-b-14'
    },
    {
      id: 'ending-a-b-14',
      type: 'dialogue',
      speaker: 'editor',
      text: '<slow>...</slow>好吧，那就跟隨你的意志繼續尋找答案吧。',
      next: 'ending-a-b-15'
    },
    {
      id: 'ending-a-b-15',
      type: 'dialogue',
      speaker: 'editor',
      text: '如果有一天，你真的找到了屬於你自己的眼睛——',
      next: 'ending-a-b-16'
    },
    {
      id: 'ending-a-b-16',
      type: 'dialogue',
      speaker: 'editor',
      text: '那麼，也告訴我一聲吧。',
      next: 'end'
    }
  ],

  // 結局 B-A：閉眼
  'ending-b-a': [
    {
      id: 'ending-b-a-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>我閉上雙眼，關閉身體主要的接收器。</em>',
      next: 'ending-b-a-2'
    },
    {
      id: 'ending-b-a-2',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>已經平靜許多，我開始思考，\n這就是我從未想過認真去看的光景嗎？</em>',
      next: 'ending-b-a-3'
    },
    {
      id: 'ending-b-a-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>凝視著黑暗才發現黑暗不只有純黑，殘影像是白噪，\n不斷地以粒子形式堆積留存於眼皮內側。</em>',
      next: 'ending-b-a-4'
    },
    {
      id: 'ending-b-a-4',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>我彷彿從這些粒子的運動，聽見了些許聲響。</em>',
      next: 'ending-b-a-5'
    },
    {
      id: 'ending-b-a-5',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>或許這就是回歸普通的方式，對嗎？</em>',
      next: 'ending-b-a-6'
    },
    {
      id: 'ending-b-a-6',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>我忍住沒有問出聲。</em>',
      next: 'ending-b-a-7'
    },
    {
      id: 'ending-b-a-7',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '<em>我相信我會找到答案的。</em>',
      next: 'end'
    }
  ],

  // 結局 B-B：不閉眼
  'ending-b-b': [
    {
      id: 'ending-b-b-1',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '......',
      next: 'ending-b-b-2'
    },
    {
      id: 'ending-b-b-2',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '我不會閉眼的，因為我不想否定我自己。',
      next: 'ending-b-b-3'
    },
    {
      id: 'ending-b-b-3',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '這雙眼看到的東西，也都屬於我的一部分。',
      next: 'ending-b-b-4'
    },
    {
      id: 'ending-b-b-4',
      type: 'dialogue',
      speaker: 'protagonist',
      text: '你口口聲聲說著我並非<slow>「不是普通人」</slow>，卻要我閉上雙眼才能接近普通。',
      next: 'end'
    }
  ],

  // 結束標記
  end: []
};

export default chapter2Script;
