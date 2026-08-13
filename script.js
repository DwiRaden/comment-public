// ============================================
// SUPABASE
// ============================================

const SUPABASE_URL =
  "https://blfkirpgfyekzzjzjdpe.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_U2at4VScoGw7vFR8MkxiQw_y9q-kGmf";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ============================================
// STATE
// ============================================

let selectedGeneration = "";

let currentSearchName = "";


// ============================================
// ELEMENTS
// ============================================

const notice =
  document.getElementById("notice");

const recipient =
  document.getElementById("recipient");

const sender =
  document.getElementById("sender");

const message =
  document.getElementById("message");

const messageCounter =
  document.getElementById("messageCounter");

const sendBtn =
  document.getElementById("sendBtn");

const searchName =
  document.getElementById("searchName");

const searchBtn =
  document.getElementById("searchBtn");

const results =
  document.getElementById("results");


// ============================================
// NOTICE
// ============================================

let noticeTimeout;

function showNotice(
  text,
  success = false
) {

  clearTimeout(noticeTimeout);

  notice.textContent = text;

  notice.className =
    "notice show" +
    (success ? " success" : "");

  noticeTimeout =
    setTimeout(() => {

      notice.className =
        "notice";

    }, 4500);

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    String(value ?? "");

  return div.innerHTML;

}


// ============================================
// PAGE
// ============================================

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.remove("active");

    });


  const page =
    document.getElementById(pageId);


  if (!page) return;


  page.classList.add("active");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ============================================
// QUICK GENERATION
// ============================================

function quickGeneration(
  generation
) {

  showPage("sendPage");

  selectGeneration(
    generation
  );

}


// ============================================
// SELECT GENERATION
// ============================================

function selectGeneration(
  generation
) {

  selectedGeneration =
    generation;


  document
    .querySelectorAll(
      ".generation-select button"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.generation ===
        generation
      );

    });

}


// ============================================
// ANONYMOUS
// ============================================

function setAnonymous() {

  sender.value =
    "Anonymous";

}


// ============================================
// COUNTER
// ============================================

if (message) {

  message.addEventListener(
    "input",
    () => {

      messageCounter.textContent =
        `${message.value.length} / 500`;

    }
  );

}


// ============================================
// SEND MAIN MESSAGE
// ============================================

async function sendMessage() {

  const to =
    recipient.value.trim();

  const from =
    sender.value.trim() ||
    "Anonymous";

  const content =
    message.value.trim();


  if (!selectedGeneration) {

    showNotice(
      "Pilih angkatan terlebih dahulu."
    );

    return;
  }


  if (!to) {

    showNotice(
      "Masukkan nama penerima."
    );

    recipient.focus();

    return;
  }


  if (!content) {

    showNotice(
      "Pesan tidak boleh kosong."
    );

    message.focus();

    return;
  }


  sendBtn.disabled =
    true;

  sendBtn.textContent =
    "Mengirim...";


  const { error } =
    await db
      .from("messages")
      .insert({

        sender:
          from,

        recipient:
          to,

        generation:
          selectedGeneration,

        content:
          content,

        parent_id:
          null

      });


  if (error) {

    console.error(
      "SEND ERROR:",
      error
    );

    showNotice(
      "Gagal mengirim pesan: " +
      error.message
    );

    sendBtn.disabled =
      false;

    sendBtn.textContent =
      "Kirim 💌";

    return;
  }


  recipient.value =
    "";

  message.value =
    "";

  messageCounter.textContent =
    "0 / 500";


  showNotice(
    "Pesan berhasil dikirim! 💌",
    true
  );


  sendBtn.textContent =
    "Terkirim ✓";


  setTimeout(() => {

    sendBtn.disabled =
      false;

    sendBtn.textContent =
      "Kirim 💌";

  }, 1200);

}


// ============================================
// SEARCH
// ============================================

async function searchMessages() {

  const name =
    searchName.value.trim();


  if (!name) {

    showNotice(
      "Masukkan nama yang ingin dicari."
    );

    return;
  }


  currentSearchName =
    name;


  searchBtn.disabled =
    true;

  searchBtn.textContent =
    "Mencari...";


  results.innerHTML = `
    <div class="empty">
      Mencari pesan...
    </div>
  `;


  const { data, error } =
    await db
      .from("messages")
      .select(`
        id,
        sender,
        recipient,
        generation,
        content,
        created_at,
        parent_id
      `)
      .ilike(
        "recipient",
        name
      )
      .is(
        "parent_id",
        null
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "SEARCH ERROR:",
      error
    );

    results.innerHTML = `
      <div class="empty">
        Gagal mencari pesan.
      </div>
    `;

    showNotice(
      "Gagal mencari pesan: " +
      error.message
    );

    searchBtn.disabled =
      false;

    searchBtn.textContent =
      "Cari";

    return;
  }


  await renderMessages(
    data || [],
    name
  );


  searchBtn.disabled =
    false;

  searchBtn.textContent =
    "Cari";

}


// ============================================
// RENDER MESSAGES
// ============================================

async function renderMessages(
  messages,
  name
) {

  results.innerHTML =
    "";


  if (!messages.length) {

    results.innerHTML = `
      <div class="empty">
        Belum ada pesan untuk
        <strong>
          ${escapeHTML(name)}
        </strong>.
      </div>
    `;

    return;
  }


  const title =
    document.createElement("div");

  title.className =
    "result-title";

  title.textContent =
    `${messages.length} pesan untuk ${name}`;

  results.appendChild(
    title
  );


  for (
    const item of messages
  ) {

    const card =
      await createMessageCard(
        item
      );

    results.appendChild(
      card
    );

  }

}


// ============================================
// CREATE MESSAGE CARD
// ============================================

async function createMessageCard(
  item
) {

  const card =
    document.createElement("article");

  card.className =
    "message";


  card.innerHTML = `

    <div class="message-head">

      <div>

        <div class="sender">
          ${escapeHTML(item.sender)}
        </div>

        <div class="recipient-info">
          Untuk
          ${escapeHTML(item.recipient)}
        </div>

      </div>

      <div class="time">
        ${formatDate(
          item.created_at
        )}
      </div>

    </div>


    <div class="message-content">
      ${escapeHTML(item.content)}
    </div>


    <span class="generation-tag">
      ${generationName(
        item.generation
      )}
    </span>


    <div>

      <button
        class="reply-button"
        onclick="toggleComments(
          ${item.id}
        )"
      >
        💬 Komentar
      </button>

    </div>


    <div
      class="comments-area"
      id="comments-${item.id}"
    >

      <div
        class="comments-list"
        id="comments-list-${item.id}"
      >
        <div class="empty">
          Memuat komentar...
        </div>
      </div>


      <div class="reply-box">

        <input
          id="reply-name-${item.id}"
          maxlength="30"
          placeholder="Nama kamu (opsional)"
        >


        <textarea
          id="reply-content-${item.id}"
          maxlength="500"
          placeholder="Tulis komentar..."
        ></textarea>


        <button
          class="reply-send"
          onclick="sendReply(
            ${item.id}
          )"
        >
          Kirim Komentar
        </button>

      </div>

    </div>

  `;


  const commentsArea =
    card.querySelector(
      ".comments-area"
    );

  commentsArea.style.display =
    "none";


  return card;

}


// ============================================
// TOGGLE COMMENTS
// ============================================

async function toggleComments(
  id
) {

  const area =
    document.getElementById(
      `comments-${id}`
    );


  if (!area) return;


  if (
    area.style.display ===
    "none"
  ) {

    area.style.display =
      "block";

    await loadComments(
      id
    );

  } else {

    area.style.display =
      "none";

  }

}


// ============================================
// LOAD COMMENTS
// ============================================

async function loadComments(
  parentId
) {

  const list =
    document.getElementById(
      `comments-list-${parentId}`
    );


  if (!list) return;


  const { data, error } =
    await db
      .from("messages")
      .select(`
        id,
        sender,
        recipient,
        generation,
        content,
        created_at,
        parent_id
      `)
      .eq(
        "parent_id",
        parentId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "COMMENTS ERROR:",
      error
    );

    list.innerHTML = `
      <div class="empty">
        Gagal memuat komentar.
      </div>
    `;

    return;
  }


  list.innerHTML =
    "";


  if (
    !data ||
    data.length === 0
  ) {

    list.innerHTML = `
      <div class="empty">
        Belum ada komentar.
      </div>
    `;

    return;
  }


  data.forEach(
    comment => {

      const element =
        createCommentElement(
          comment
        );

      list.appendChild(
        element
      );

    }
  );

}


// ============================================
// CREATE COMMENT
// ============================================

function createCommentElement(
  comment
) {

  const div =
    document.createElement("div");

  div.className =
    "message-comment";


  div.innerHTML = `

    <div class="comment-head">

      <strong>
        ${escapeHTML(
          comment.sender
        )}
      </strong>

      <span>
        ${formatDate(
          comment.created_at
        )}
      </span>

    </div>


    <div class="comment-content">
      ${escapeHTML(
        comment.content
      )}
    </div>

  `;


  return div;

}


// ============================================
// SEND COMMENT
// ============================================

async function sendReply(
  parentId
) {

  const nameInput =
    document.getElementById(
      `reply-name-${parentId}`
    );

  const contentInput =
    document.getElementById(
      `reply-content-${parentId}`
    );


  const from =
    nameInput.value.trim() ||
    "Anonymous";

  const content =
    contentInput.value.trim();


  if (!content) {

    showNotice(
      "Komentar tidak boleh kosong."
    );

    contentInput.focus();

    return;
  }


  /*
    Ambil pesan utama.
    Kita hanya mengambil recipient
    dan generation agar komentar
    tetap punya data yang valid.
  */

  const {
    data: parent,
    error: parentError
  } =
    await db
      .from("messages")
      .select(`
        recipient,
        generation
      `)
      .eq(
        "id",
        parentId
      )
      .single();


  if (parentError) {

    console.error(
      "PARENT ERROR:",
      parentError
    );

    showNotice(
      "Pesan yang dibalas tidak ditemukan."
    );

    return;
  }


  /*
    INSERT KOMENTAR

    parent_id = ID PESAN
    YANG SEDANG DIBALAS
  */

  const { error } =
    await db
      .from("messages")
      .insert({

        sender:
          from,

        recipient:
          parent.recipient,

        generation:
          parent.generation,

        content:
          content,

        parent_id:
          parentId

      });


  if (error) {

    console.error(
      "COMMENT ERROR:",
      error
    );

    showNotice(
      "Gagal mengirim komentar: " +
      error.message
    );

    return;
  }


  contentInput.value =
    "";


  showNotice(
    "Komentar berhasil dikirim! 💬",
    true
  );


  await loadComments(
    parentId
  );

}


// ============================================
// GENERATION NAME
// ============================================

function generationName(
  value
) {

  const names = {

    angkatan_11:
      "ANGKATAN 11",

    angkatan_12:
      "ANGKATAN 12",

    angkatan_13:
      "ANGKATAN 13"

  };


  return (
    names[value] ||
    value ||
    "ANGKATAN"
  );

}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(
  value
) {

  try {

    return new Date(
      value
    ).toLocaleString(
      "id-ID",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short"
      }
    );

  } catch {

    return "";

  }

}


// ============================================
// REALTIME
// ============================================

db.channel(
  "messages-live"
)
.on(
  "postgres_changes",
  {
    event: "INSERT",
    schema: "public",
    table: "messages"
  },
  async payload => {

    const newMessage =
      payload.new;


    /*
      ==============================
      KOMENTAR BARU
      ==============================
    */

    if (
      newMessage.parent_id
    ) {

      const list =
        document.getElementById(
          `comments-list-${newMessage.parent_id}`
        );


      if (list) {

        await loadComments(
          newMessage.parent_id
        );

      }


      return;
    }


    /*
      ==============================
      PESAN UTAMA BARU
      ==============================
    */

    if (
      currentSearchName &&
      String(
        newMessage.recipient
      ).toLowerCase() ===
      String(
        currentSearchName
      ).toLowerCase()
    ) {

      await searchMessages();

    }

  }
)
.subscribe();


// ============================================
// ENTER TO SEARCH
// ============================================

if (searchName) {

  searchName.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        searchMessages();

      }

    }
  );

}