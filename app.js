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

let isLoading = false;


/* =========================================================
   한국 기준 오늘 날짜
========================================================= */

function getToday() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());
}


/* =========================================================
   한국 기준 날짜 + 시간
========================================================= */

function getDateTime(dateValue) {

  const date =
    new Date(dateValue);

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
    formatter.formatToParts(date);

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

  if (
    !savedUser ||
    savedUser.trim() === "" ||
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

function formatCount(value) {

  return String(value)
    .padStart(
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

  } else if (
    b2Status === "CLOSE"
  ) {

    element.textContent =
      "CLOSE";

    element.classList.add(
      "close"
    );

  } else {

    element.textContent =
      "-";
  }
}


/* =========================================================
   현재 화면 상태 불러오기

   숫자:
   counter_states

   B2:
   오늘 counter_events
========================================================= */

async function loadTodayData() {

  if (
    !supabase ||
    isLoading
  ) {

    return;
  }

  isLoading = true;

  try {

    const today =
      getToday();


    /* =====================================================
       2F / 1F / B1 현재 숫자
    ===================================================== */

    const {
      data: stateData,
      error: stateError
    } =
      await supabase
        .from(
          "counter_states"
        )
        .select(
          "category, current_value, updated_at"
        )
        .in(
          "category",
          FLOORS
        );


    if (
      stateError
    ) {

      console.error(
        "현재 카운터 불러오기 오류:",
        stateError
      );

    } else {

      const newCounts =
        createEmptyCounts();


      if (
        Array.isArray(
          stateData
        )
      ) {

        stateData.forEach(
          item => {

            if (
              !FLOORS.includes(
                item.category
              )
            ) {

              return;
            }


            const updatedDate =
              new Intl.DateTimeFormat(
                "en-CA",
                {
                  timeZone:
                    "Asia/Seoul",

                  year:
                    "numeric",

                  month:
                    "2-digit",

                  day:
                    "2-digit"
                }
              ).format(
                new Date(
                  item.updated_at
                )
              );


            if (
              updatedDate === today
            ) {

              newCounts[
                item.category
              ] =
                Number(
                  item.current_value
                ) || 0;
            }

          }
        );
      }


      counts =
        newCounts;
    }


    /* =====================================================
       오늘 B2 상태 확인
    ===================================================== */

    const {
      data: eventData,
      error: eventError
    } =
      await supabase
        .from(
          "counter_events"
        )
        .select(
          "id, category, current_status"
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
      eventError
    ) {

      console.error(
        "B2 기록 불러오기 오류:",
        eventError
      );

    } else {

      let newB2Status =
        null;


      if (
        Array.isArray(
          eventData
        )
      ) {

        eventData.forEach(
          item => {

            if (
              item.category === "B2" &&
              (
                item.current_status === "OPEN" ||
                item.current_status === "CLOSE"
              )
            ) {

              newB2Status =
                item.current_status;
            }


            /*
              RESET 이후 B2도 초기화
            */

            if (
              item.category === "RESET"
            ) {

              newB2Status =
                null;
            }

          }
        );
      }


      b2Status =
        newB2Status;
    }


    render();

  } catch (
    error
  ) {

    console.error(
      "데이터 로드 오류:",
      error
    );

  } finally {

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


    const newValue =
      Number(data);


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


    await loadTodayData();

  } catch (
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
   B2 OPEN / CLOSE 저장
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

  } catch (
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

   중요:
   기록은 절대 삭제하지 않음.

   현재 상태만 초기화하고
   RESET 이벤트를 새 기록으로 추가
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
      "현재 카운터를 초기화하시겠습니까?"
    );


  if (
    !confirmReset
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
        .rpc(
          "reset_counters",
          {

            p_user_name:
              userName

          }
        );


    if (
      error
    ) {

      console.error(
        "RESET 오류:",
        error
      );

      alert(
        "카운터 초기화 중 오류가 발생했습니다."
      );

      return;
    }


    /*
      현재 화면만 초기화
    */

    counts =
      createEmptyCounts();

    b2Status =
      null;

    render();


    /*
      과거 기록은 건드리지 않음
    */

    await loadTodayData();

  } catch (
    error
  ) {

    console.error(
      "RESET 처리 오류:",
      error
    );

    alert(
      "초기화 중 오류가 발생했습니다."
    );
  }
}


/* =========================================================
   날짜 변경 시 화면 초기화

   과거 Supabase 기록은 삭제하지 않음
========================================================= */

function automaticDailyReset() {

  counts =
    createEmptyCounts();

  b2Status =
    null;

  clearUser();

  render();

  askUserName();

  loadTodayData();
}


/* =========================================================
   자정 자동 처리
========================================================= */

function scheduleMidnightReset() {

  const now =
    new Date();


  const koreaNow =
    new Date(
      now.toLocaleString(
        "en-US",
        {
          timeZone:
            "Asia/Seoul"
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
    midnight.getTime() -
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

   ★ 모든 날짜
   ★ 모든 사용자
   ★ 모든 카운트
   ★ 모든 B2 상태
   ★ 모든 RESET 기록

   전부 다운로드
========================================================= */

async function exportExcel() {

  if (
    checkDate()
  ) {

    return;
  }


  if (
    typeof XLSX === "undefined"
  ) {

    alert(
      "엑셀 기능을 불러오지 못했습니다."
    );

    return;
  }


  try {

    /*
      날짜 조건을 걸지 않음.

      counter_events에 저장된
      모든 기록을 가져옴.
    */

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
        "전체 기록 불러오기 오류:",
        error
      );

      alert(
        "엑셀 기록을 불러오지 못했습니다."
      );

      return;
    }


    if (
      !Array.isArray(data) ||
      data.length === 0
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


    data.forEach(
      item => {

        excelData.push(
          [

            getDateTime(
              item.created_at
            ),

            item.user_name || "",

            item.category || "",

            item.current_status || ""

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
      `COUNTER_ALL_${getToday()}.xlsx`
    );

  } catch (
    error
  ) {

    console.error(
      "Excel 오류:",
      error
    );

    alert(
      "엑셀 다운로드 중 오류가 발생했습니다."
    );
  }
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


      minusButton.addEventListener(
        "click",
        () => {

          changeCount(
            floor,
            -1
          );

        }
      );


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


  document
    .getElementById(
      "reset-button"
    )
    .addEventListener(
      "click",
      manualReset
    );


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
   다른 기기와 자동 동기화
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

    const module =
      await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
      );


    supabase =
      module.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );


    loadUser();

    setupButtons();

    await loadTodayData();

    startAutoSync();

    scheduleMidnightReset();


    document.addEventListener(
      "visibilitychange",
      async () => {

        if (
          document.visibilityState ===
          "visible"
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
      "COUNTER 연결 완료"
    );

  } catch (
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
