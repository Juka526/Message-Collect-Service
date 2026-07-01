Create a responsive web experience for a Christian youth retreat program called “하나님께 쓰는 문자”.

The web app has two main parts:

1. Mobile submission page for participants
2. Large display page for the whole group to view submitted messages

The concept:
Participants write a short anonymous message to God after a small group sharing session. The messages should feel like KakaoTalk-style prayer messages, but also like soft prayer cards or post-it notes gathered in a beautiful emotional space. The overall mood should be warm, aesthetic, youthful, peaceful, and suitable for a Korean church youth retreat.

Use Korean text for the UI.

---

## Overall design direction

Style keywords:

* 감성적인 청년부 수련회 느낌
* 따뜻하고 예쁜 기도 분위기
* soft, emotional, peaceful, youthful
* message bubbles + prayer cards + post-it wall
* gentle light, warm ivory, soft beige, pale yellow, soft sky blue
* rounded corners, soft shadows, subtle gradients
* not too childish, not too formal
* modern but warm

Do not make it look like a corporate survey form.
Do not make it too dark or too heavy.
It should feel like young people are writing short sincere prayers to God.

---

## Page 1: Mobile submission page

This page is used through a QR code on each participant’s phone.

Title:
“하나님께 쓰는 문자”

Subtitle:
“오늘 나눔을 통해 하나님께 드리고 싶은 마음을 짧은 문자로 남겨주세요.”

Main input area:
Design it like a mix between a KakaoTalk chat input and a prayer card.

Fields:

1. Group selector

* Label: “조 선택”
* Options: 1조, 2조, 3조, 4조, 5조, 6조, 7조, 8조, 9조, 10조
* The message will be displayed anonymously, but the group can be selected.

2. Message input

* Placeholder:
  “하나님, 지금 제 마음은요…”
* Maximum length: 120 Korean characters
* Show character counter: “0 / 120”
* Allow 1–2 short sentences only.

3. Submit button

* Button text: “문자 보내기”
* Button should feel warm and inviting.

Important notice below the input:
“작성한 문자는 익명으로 전체 화면에 표시될 수 있습니다. 너무 개인적이거나 민감한 내용, 다른 사람의 이름은 적지 말아주세요.”

After submission:
Show a gentle confirmation screen or toast:
“하나님께 보내는 문자가 도착했어요.”
“함께 모인 고백을 통해 하나님이 우리 가운데 일하시길 기대해요.”

Include a button:
“하나 더 보내기”

---

## Example messages shown as helper text

Display 2–3 small example cards below the input.

Examples:
“하나님, 제가 사람들의 시선보다 하나님의 시선을 더 믿게 해주세요.”

“하나님, 제가 가진 은사를 나를 증명하는 도구가 아니라 공동체를 섬기는 선물로 사용하게 해주세요.”

“하나님, 제가 이미 복음 안에서 사랑받는 사람이라는 사실을 다시 붙잡고 싶어요.”

---

## Page 2: Large display page

This page is shown on a projector or large screen during the final sharing time.

Title at top:
“하나님께 쓰는 문자”

Subtitle:
“우리의 마음이 하나님께 모이고 있습니다.”

Submitted messages should appear immediately on the display page after submission.

Visual concept:
Combine two styles:

1. Post-it / prayer card layout
2. A draggable visual exploration space like an aesthetic scattered card gallery

The display should look like many soft message cards are gathered in a beautiful open space.

Cards:

* Each card contains the submitted message.
* Show only group name and anonymous label, for example:
  “3조 · 익명”
* Do not show personal names.
* Each card should look like a soft rounded prayer card or message bubble.
* Use slightly varied card sizes, gentle rotations, and soft shadows.
* Cards should feel naturally scattered, not in a strict grid.
* But the text must remain readable.

Interaction:

* The display canvas can be dragged to explore more messages.
* Add a subtle hint:
  “Drag to explore”
  or in Korean:
  “드래그해서 함께 모인 문자들을 둘러보세요”

Animation:

* New messages should gently fade in or slide in.
* Cards may softly float or breathe very subtly.
* Avoid distracting animations.

---

## Spotlight toggle mode

Add a toggle or button on the display page called:
“스포트라이트 모드”

When OFF:

* Show the scattered card gallery view.

When ON:

* Allow the presenter to select one message card.
* The selected message becomes large in the center of the screen.
* Background cards become blurred or dimmed.
* This mode is used only when the leader wants to read a few messages aloud.

Spotlight screen should show:

* Large message
* Group label, for example “7조 · 익명”
* Button: “다음 문자”
* Button: “전체 보기로 돌아가기”

---

## Empty state

If no messages have been submitted yet, show:

Title:
“아직 도착한 문자가 없어요.”

Text:
“QR코드로 접속해 하나님께 지금 마음을 남겨주세요.”

Show a few soft placeholder cards in the background.

---

## Data behavior

For the prototype:

* Include realistic sample messages so the display page looks populated.
* Also allow new messages submitted from the mobile page to appear in the display state.
* If real-time backend is not available, simulate real-time behavior with local state and sample data.
* Structure the design so it can later be connected to Firebase, Supabase, or another real-time database.

Message object structure:

* id
* group: “1조” to “10조”
* message
* createdAt
* isAnonymous: true

---

## Responsive requirements

Mobile submission page:

* Optimized for iPhone and Android screen sizes.
* Large readable text.
* Easy one-hand input.
* Submit button fixed or easy to reach.

Display page:

* Optimized for 16:9 projector screen.
* Text should be readable from a distance.
* Use large enough card text.
* Avoid overcrowding.
* If there are many messages, allow dragging or panning through the canvas.

---

## Korean UI copy

Use these exact Korean texts where appropriate:

Main title:
“하나님께 쓰는 문자”

Mobile subtitle:
“오늘 나눔을 통해 하나님께 드리고 싶은 마음을 짧은 문자로 남겨주세요.”

Input placeholder:
“하나님, 지금 제 마음은요…”

Submit button:
“문자 보내기”

Character count:
“0 / 120”

Notice:
“작성한 문자는 익명으로 전체 화면에 표시될 수 있습니다. 너무 개인적이거나 민감한 내용, 다른 사람의 이름은 적지 말아주세요.”

Success message:
“하나님께 보내는 문자가 도착했어요.”

Display subtitle:
“우리의 마음이 하나님께 모이고 있습니다.”

Drag hint:
“드래그해서 함께 모인 문자들을 둘러보세요.”

Spotlight mode:
“스포트라이트 모드”

Back button:
“전체 보기로 돌아가기”

Next button:
“다음 문자”

Empty state:
“아직 도착한 문자가 없어요.”
“QR코드로 접속해 하나님께 지금 마음을 남겨주세요.”

---

## Final goal

The final experience should help participants feel that their short prayers and honest reflections are being gathered before God as one community.

The design should feel beautiful, warm, sincere, and memorable.

Create both:

1. Mobile participant submission screen
2. Projector display screen with scattered anonymous prayer message cards and spotlight mode
