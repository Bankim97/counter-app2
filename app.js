/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://hjoalszwmhsvexwgfhik.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KW4Z6wpiYwpAqiXcic2G7w_5m43Bp2l";


/* =========================================================
   CONFIG
========================================================= */

const RESET_PASSWORD = "1210";

const FLOORS = [
  "2F",
  "1F",
  "B1"
];


/* =========================================================
   VARIABLES
========================================================= */

let supabase = null;

let counts = {
  "2F": 0,
  "1F": 0,
  "B1": 0
};

let b2Status = null;

let logs = [];

let isLoading = false;


/* =========================================================
   한국 기준 오늘 날짜
========================================================= */

function getToday() {

  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    );


  return formatter.format(
    new Date()
  );
}


/* =========================================================
   한국 기준 날짜 + 시간
========================================================= */

function getDateTime(
  dateValue
) {

  const date =
    new Date(
      dateValue
    );


  const formatter =
    new Intl.DateTimeFormat(
      "ko-KR",
      {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    );


  const parts =
    formatter.formatToParts(
      date
    );


  const result = {};


  parts.forEach(
    part => {

      if (
        part.type !== "literal"
      ) {

        result[
          part.type
        ] =
          part.value;
      }

    }
  );


  return (
    `${result.year}-` +
    `${result.month}-` +
    `${result.day} ` +
    `${result.hour}:` +
    `${result.minute}:` +
    `${result.second}`
  );
}


/* =========================================================
   사용자 이름 입력
========================================================= */

function askUserName() {

  let userName = "";


  while (
    !userName
  ) {

    const input =
      prompt(
        "사용자 이름을 입력해주세요."
      );


    /*
      취소를 눌러도
      사용자 이름은 반드시 입력
    */

    if (
      input === null
    ) {

      continue;
    }


    userName =
      input.trim();
  }


  localStorage.setItem(
    "counterUser",
    userName
  );


  localStorage.setItem(
    "counterUserDate",
    getToday()
  );


  return userName;
}


/* =========================================================
   사용자 이름 불러오기
========================================================= */

function loadUser() {

  const today =
    getToday();


  const savedUser =
    localStorage.getItem(
      "counterUser"
    );


  const savedDate =
    localStorage.getItem(
      "counterUserDate"
    );


  /*
    이름이 없거나
    날짜가 바뀌었으면
    새로 입력
  */

  if (
    !savedUser
    ||
    savedUser.trim() === ""
    ||
    savedDate !== today
  ) {

    clearUser();

    return askUserName();
  }


  return savedUser;
}


/* =========================================================
   사용자 이름 삭제
========================================================= */

function clearUser() {

  localStorage.removeItem(
    "counterUser"
  );


  localStorage.removeItem(
    "counterUserDate"
  );
}


/* =========================================================
   기본 카운터
========================================================= */

function createEmptyCounts() {

  return {
    "2F": 0,
    "1F": 0,
    "B1": 0
  };
}


/* =========================================================
   숫자 표시
========================================================= */

function formatCount(
  value
) {

  return String(
    value
  ).padStart(
    3,
    "0"
  );
}


/* =========================================================
   화면 출력
========================================================= */

function render() {

  FLOORS.forEach(
    floor => {

      const element =
        document.getElementById(
          `count-${floor}`
        );


      if (
        element
      ) {

        element.textContent =
          formatCount(
            counts[floor]
          );
      }

    }
  );


  renderB2();
}


/* =========================================================
   B2 화면 출력
========================================================= */

function renderB2() {

  const element =
    document.getElementById(
      "b2-status"
    );


  if (
    !element
  ) {

    return;
  }


  element.classList.remove(
    "open",
    "close"
  );


  if (
    b2Status === "OPEN"
  ) {

    element.textContent =
      "OPEN";


    element.classList.add(
      "open"
    );

  }

  else if (
    b2Status === "CLOSE"
  ) {

    element.textContent =
      "CLOSE";


    element.classList.add(
      "close"
    );

  }

  else {

    element.textContent =
      "-";
  }
}


/* =========================================================
   오늘 기록 불러오기
========================================================= */

async function loadTodayData() {

  if (
    !supabase
    ||
    isLoading
  ) {

    return;
  }


  isLoading =
    true;


  try {

    const today =
      getToday();


    const {
      data,
      error
    } =
      await supabase
        .from(
          "counter_events"
        )
        .select(
          "id, created_at, user_name, category, current_status, event_date"
        )
        .eq(
          "event_date",
          today
        )
        .order(
          "id",
          {
            ascending: true
          }
        );


    if (
      error
    ) {

      console.error(
        "데이터 불러오기 오류:",
        error
      );

      return;
    }


    /*
      서버 기록 기준으로
      화면 상태 재구성
    */

    const newCounts =
      createEmptyCounts();


    let newB2Status =
      null;


    const newLogs =
      [];


    if (
      Array.isArray(
        data
      )
    ) {

      data.forEach(
        item => {

          const category =
            item.category;


          const status =
            item.current_status;


          /* =========================
             2F / 1F / B1
          ========================= */

          if (
            FLOORS.includes(
              category
            )
          ) {

            const number =
              parseInt(
                status,
                10
              );


            if (
              !Number.isNaN(
                number
              )
            ) {

              newCounts[
                category
              ] =
                number;
            }

          }


          /* =========================
             B2
          ========================= */

          if (
            category === "B2"
          ) {

            if (
              status === "OPEN"
              ||
              status === "CLOSE"
            ) {

              newB2Status =
                status;
            }

          }


          /* =========================
             LOG
          ========================= */

          newLogs.push(
            {

              datetime:
                getDateTime(
                  item.created_at
                ),

              user:
                item.user_name || "",

              category:
                item.category || "",

              status:
                item.current_status || ""

            }
          );

        }
      );
    }


    counts =
      newCounts;


    b2Status =
      newB2Status;


    logs =
      newLogs;


    render();

  }

  catch (
    error
  ) {

    console.error(
      "데이터 로드 오류:",
      error
    );

  }

  finally {

    isLoading =
      false;
  }
}


/* =========================================================
   날짜 변경 확인
========================================================= */

function checkDate() {

  const today =
    getToday();


  const savedUserDate =
    localStorage.getItem(
      "counterUserDate"
    );


  if (
    savedUserDate !== today
  ) {

    automaticDailyReset();

    return true;
  }


  return false;
}


/* =========================================================
   2F / 1F / B1 카운터 변경

   ★ 중요 ★

   여기서는 브라우저가 직접
   +1 / -1을 계산하지 않음.

   Supabase PostgreSQL 함수가
   원자적으로 처리함.

   따라서 여러 기기에서 동시에
   클릭해도 순서대로 처리됨.
========================================================= */

async function changeCount(
  floor,
  amount
) {

  if (
    checkDate()
  ) {

    return;
  }


  const userName =
    loadUser();


  try {

    const {
      data,
      error
    } =
      await supabase
        .rpc(
          "change_counter",
          {

            p_category:
              floor,

            p_amount:
              amount,

            p_user_name:
              userName

          }
        );


    if (
      error
    ) {

      console.error(
        "카운터 변경 오류:",
        error
      );


      alert(
        "카운터 저장 중 오류가 발생했습니다."
      );


      return;
    }


    /*
      Supabase 함수가 돌려준
      최종 숫자
    */

    const newValue =
      Number(
        data
      );


    if (
      !Number.isNaN(
        newValue
      )
    ) {

      counts[
        floor
      ] =
        newValue;


      render();
    }


    /*
      서버 전체 상태 다시 동기화
    */

    await loadTodayData();

  }

  catch (
    error
  ) {

    console.error(
      "카운터 처리 오류:",
      error
    );


    alert(
      "카운터 처리 중 오류가 발생했습니다."
    );
  }
}


/* =========================================================
   B2 상태 저장
========================================================= */

async function setB2Status(
  status
) {

  if (
    checkDate()
  ) {

    return;
  }


  const userName =
    loadUser();


  try {

    const {
      error
    } =
      await supabase
        .from(
          "counter_events"
        )
        .insert(
          {

            user_name:
              userName,

            category:
              "B2",

            current_status:
              status,

            event_date:
              getToday()

          }
        );


    if (
      error
    ) {

      console.error(
        "B2 저장 오류:",
        error
      );


      alert(
        "B2 상태 저장 중 오류가 발생했습니다."
      );


      return;
    }


    b2Status =
      status;


    renderB2();


    await loadTodayData();

  }

  catch (
    error
  ) {

    console.error(
      "B2 처리 오류:",
      error
    );
  }
}


/* =========================================================
   RESET
========================================================= */

async function manualReset() {

  const password =
    prompt(
      "RESET 비밀번호를 입력해주세요."
    );


  if (
    password === null
  ) {

    return;
  }


  if (
    password !== RESET_PASSWORD
  ) {

    alert(
      "비밀번호가 올바르지 않습니다."
    );


    return;
  }


  const confirmReset =
    confirm(
      "카운터 데이터를 초기화하시겠습니까?"
    );


  if (
    !confirmReset
  ) {

    return;
  }


  const today =
    getToday();


  try {

    /* =========================
       현재 카운터 0으로 초기화
    ========================= */

    const {
      error: stateError
    } =
      await supabase
        .from(
          "counter_states"
        )
        .update(
          {

            current_value:
              0,

            updated_at:
              new Date()
                .toISOString()

          }
        )
        .in(
          "category",
          FLOORS
        );


    if (
      stateError
    ) {

      console.error(
        "상태 초기화 오류:",
        stateError
      );


      alert(
        "카운터 초기화 중 오류가 발생했습니다."
      );


      return;
    }


    /* =========================
       오늘 로그 삭제
    ========================= */

    const {
      error: logError
    } =
      await supabase
        .from(
          "counter_events"
        )
        .delete()
        .eq(
          "event_date",
          today
        );


    if (
      logError
    ) {

      console.error(
        "로그 초기화 오류:",
        logError
      );


      alert(
        "기록 초기화 중 오류가 발생했습니다."
      );


      return;
    }


    /*
      사용자 이름은 유지
    */


    counts =
      createEmptyCounts();


    b2Status =
      null;


    logs =
      [];


    render();

  }

  catch (
    error
  ) {

    console.error(
      "RESET 오류:",
      error
    );


    alert(
      "초기화 중 오류가 발생했습니다."
    );
  }
}


/* =========================================================
   자정 자동 초기화

   서버 기록을 삭제하는 것이 아니라
   새 날짜로 넘어가기 때문에
   화면은 자동으로 0부터 시작.

   사용자 이름만 삭제 후
   다시 입력받음.
========================================================= */

function automaticDailyReset() {

  counts =
    createEmptyCounts();


  b2Status =
    null;


  logs =
    [];


  /*
    이름 초기화
  */

  clearUser();


  render();


  /*
    새 날짜 사용자 이름
  */

  askUserName();


  /*
    새 날짜 기록 불러오기
  */

  loadTodayData();
}


/* =========================================================
   밤 12시 자동 실행
========================================================= */

function scheduleMidnightReset() {

  const now =
    new Date();


  /*
    한국 현재시각 계산
  */

  const koreaNow =
    new Date(
      now.toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Seoul"
        }
      )
    );


  const midnight =
    new Date(
      koreaNow
    );


  midnight.setDate(
    midnight.getDate() + 1
  );


  midnight.setHours(
    0,
    0,
    0,
    0
  );


  const delay =
    midnight.getTime()
    -
    koreaNow.getTime();


  setTimeout(
    () => {

      automaticDailyReset();


      scheduleMidnightReset();

    },

    delay
  );
}


/* =========================================================
   EXCEL DOWNLOAD
========================================================= */

async function exportExcel() {

  if (
    checkDate()
  ) {

    return;
  }


  /*
    다운로드 직전
    최신 서버 데이터 확인
  */

  await loadTodayData();


  if (
    typeof XLSX === "undefined"
  ) {

    alert(
      "엑셀 기능을 불러오지 못했습니다."
    );


    return;
  }


  if (
    logs.length === 0
  ) {

    alert(
      "저장된 기록이 없습니다."
    );


    return;
  }


  const excelData = [

    [
      "일자와 시간",
      "사용자 이름",
      "구분",
      "현재상태"
    ]

  ];


  logs.forEach(
    item => {

      excelData.push(
        [

          item.datetime,

          item.user,

          item.category,

          item.status

        ]
      );

    }
  );


  const workbook =
    XLSX.utils.book_new();


  const worksheet =
    XLSX.utils.aoa_to_sheet(
      excelData
    );


  worksheet[
    "!cols"
  ] =
    [

      {
        wch: 22
      },

      {
        wch: 18
      },

      {
        wch: 12
      },

      {
        wch: 15
      }

    ];


  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "COUNTER LOG"
  );


  XLSX.writeFile(
    workbook,
    `COUNTER_${getToday()}.xlsx`
  );
}


/* =========================================================
   BUTTON EVENT
========================================================= */

function setupButtons() {

  const rows =
    document.querySelectorAll(
      ".counter-row[data-floor]"
    );


  rows.forEach(
    row => {

      const floor =
        row.dataset.floor;


      const minusButton =
        row.querySelector(
          '[data-action="minus"]'
        );


      const plusButton =
        row.querySelector(
          '[data-action="plus"]'
        );


      /* =========================
         MINUS
      ========================= */

      minusButton.addEventListener(
        "click",
        () => {

          changeCount(
            floor,
            -1
          );

        }
      );


      /* =========================
         PLUS
      ========================= */

      plusButton.addEventListener(
        "click",
        () => {

          changeCount(
            floor,
            1
          );

        }
      );

    }
  );


  /* =========================
     B2 OPEN
  ========================= */

  document
    .getElementById(
      "open-button"
    )
    .addEventListener(
      "click",
      () => {

        setB2Status(
          "OPEN"
        );

      }
    );


  /* =========================
     B2 CLOSE
  ========================= */

  document
    .getElementById(
      "close-button"
    )
    .addEventListener(
      "click",
      () => {

        setB2Status(
          "CLOSE"
        );

      }
    );


  /* =========================
     RESET
  ========================= */

  document
    .getElementById(
      "reset-button"
    )
    .addEventListener(
      "click",
      manualReset
    );


  /* =========================
     EXCEL
  ========================= */

  document
    .getElementById(
      "excel-button"
    )
    .addEventListener(
      "click",
      exportExcel
    );
}


/* =========================================================
   자동 동기화

   다른 노트북 / 휴대폰에서
   누른 내용도 화면에 표시
========================================================= */

function startAutoSync() {

  setInterval(
    async () => {

      if (
        checkDate()
      ) {

        return;
      }


      await loadTodayData();

    },

    1000
  );
}


/* =========================================================
   INIT
========================================================= */

async function init() {

  try {

    /* =========================
       Supabase Library
    ========================= */

    const module =
      await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
      );


    supabase =
      module.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );


    /* =========================
       사용자 이름

       화면 진입 즉시 이름 확인
    ========================= */

    loadUser();


    /* =========================
       버튼
    ========================= */

    setupButtons();


    /* =========================
       오늘 데이터
    ========================= */

    await loadTodayData();


    /* =========================
       다른 기기와 자동 동기화
    ========================= */

    startAutoSync();


    /* =========================
       자정 초기화
    ========================= */

    scheduleMidnightReset();


    /* =========================
       화면 다시 열었을 때
    ========================= */

    document.addEventListener(
      "visibilitychange",
      async () => {

        if (
          document.visibilityState
          === "visible"
        ) {

          if (
            checkDate()
          ) {

            return;
          }


          await loadTodayData();
        }

      }
    );


    console.log(
      "Supabase 연결 완료 / 동시 클릭 모드 활성화"
    );

  }

  catch (
    error
  ) {

    console.error(
      "초기화 오류:",
      error
    );


    alert(
      "Supabase 연결에 실패했습니다."
    );
  }
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);
