// ============================================
// SUPABASE
// ============================================

const SUPABASE_URL =
  "https://blfkirpgfyekzzjzjdpe.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_U2at4VScoGw7vFR8MkxiQw_y9q-kGmf";

const db = window.supabase.createClient(
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

function showNotice(text, success = false) {

  if (!notice) return;

  clearTimeout(noticeTimeout);

  notice.textContent = text;

  notice.className =
    "notice show" +
    (success ? " success" : "");

  noticeTimeout = setTimeout(() => {

    notice.className = "notice";

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

function quickGeneration(generation) {

  showPage("sendPage");

  selectGeneration(generation);
}


// ============================================
// SELECT GENERATION
// ============================================

function selectGeneration(generation) {

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

  if (sender) {
    sender.value = "Anonymous";
  }

}


// ============================================
// MESSAGE COUNTER
// ============================================

if (message) {

  message.addEventListener(
    "input",
    () => {

      if (messageCounter) {

        messageCounter.textContent =
          `${message.value.length} / 500`;

      }

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


  // Validasi angkatan
  if (!selectedGeneration) {

    showNotice(
      "Pilih angkatan terlebih dahulu."
    );

    return;
  }


  // Validasi penerima
  if (!to) {

    showNotice(
      "Masukkan nama penerima."
    );

    recipient.focus();

    return;
  }


  // Validasi pesan
  if (!content) {

    showNotice(
      "Pesan tidak boleh kosong."
    );

    message.focus();

    return;
  }


  if (content.length > 500) {

    showNotice(
      "Pesan maksimal 500 karakter."
    );

    return;
  }


  sendBtn.disabled = true;

  sendBtn.textContent =
    "Mengirim...";


  try {

    const { error } =
      await db
        .from("messages")
        .insert({

          sender: from,

          recipient: to,

          generation:
            selectedGeneration,

          content: content,

          parent_id: null

        });


    if (error) {

      console.error(
        "SEND MESSAGE ERROR:",
        error
      );

      showNotice(
        "Gagal mengirim pesan: " +
        error.message
      );

      return;
    }


    // Bersihkan form
    recipient.value = "";

    message.value = "";

    if (messageCounter) {

      messageCounter.textContent =
        "0 / 500";

    }


    showNotice(
      "Pesan berhasil dikirim! 💌",
      true
    );


    sendBtn.textContent =
      "Terkirim ✓";


  } catch (err) {

    console.error(err);

    showNotice(
      "Terjadi kesalahan saat mengirim pesan."
    );

  } finally {

    setTimeout(() => {

      sendBtn.disabled = false;

      sendBtn.textContent =
        "Kirim 💌";

    }, 1200);

  }

}


// ============================================
// SEARCH PESAN
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


  searchBtn.disabled = true;

  searchBtn.textContent =
    "Mencari...";


  results.innerHTML = `
    <div class="empty">
      Mencari pesan...
    </div>
  `;


  try {

    /*
      PENTING:

      Jangan SELECT langsung ke messages.

      Kita menggunakan RPC yang sudah dibuat
      di SQL Supabase.
    */

    const {
      data,
      error
    } = await db.rpc(
      "search_messages",
      {
        p_recipient: name
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

      return;
    }


    await renderMessages(
      data || [],
      name
    );


  } catch (err) {

    console.error(err);

    showNotice(
      "Terjadi kesalahan saat mencari pesan."
    );

  } finally {

    searchBtn.disabled = false;

    searchBtn.textContent =
      "Cari";

  }

}


// ============================================
// RENDER PESAN
// ============================================

async function renderMessages(
  messages,
  name
) {

  results.innerHTML = "";


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

  results.appendChild(title);


  /*
    Data dari RPC sudah diurutkan:
    created_at DESC

    Jadi pesan terbaru
    otomatis paling atas.
  */

  for (
    const item of messages
  ) {

    const card =
      createMessageCard(item);

    results.appendChild(card);

  }

}


// ============================================
// CREATE PESAN CARD
// ============================================

function createMessageCard(item) {

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
        ${formatDate(item.created_at)}
      </div>

    </div>


    <div class="message-content">
      ${escapeHTML(item.content)}
    </div>


    <span class="generation-tag">
      ${generationName(item.generation)}
    </span>


    <div>

      <button
        class="reply-button"
        onclick="toggleComments(${item.id})"
      >
        💬 Komentar
      </button>

    </div>


    <div
      class="comments-area"
      id="comments-${item.id}"
      style="display:none;"
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
          autocomplete="off"
        >


        <textarea
          id="reply-content-${item.id}"
          maxlength="500"
          placeholder="Tulis komentar..."
        ></textarea>


        <button
          class="reply-send"
          onclick="sendReply(${item.id})"
        >
          Kirim Komentar
        </button>

      </div>

    </div>

  `;


  return card;
}


// ============================================
// TOGGLE KOMENTAR
// ============================================

async function toggleComments(id) {

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

    await loadComments(id);

  } else {

    area.style.display =
      "none";

  }

}


// ============================================
// LOAD KOMENTAR
// ============================================

async function loadComments(
  parentId
) {

  const list =
    document.getElementById(
      `comments-list-${parentId}`
    );


  if (!list) return;


  /*
    Tidak menggunakan:

    .from("messages").select()

    karena SELECT langsung
    memang diblokir RLS.

    Gunakan RPC.
  */

  const {
    data,
    error
  } = await db.rpc(
    "get_message_comments",
    {
      p_parent_id: parentId
    }
  );


  if (error) {

    console.error(
      "LOAD COMMENTS ERROR:",
      error
    );

    list.innerHTML = `
      <div class="empty">
        Gagal memuat komentar.
      </div>
    `;

    return;
  }


  list.innerHTML = "";


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


  data.forEach(comment => {

    const element =
      createCommentElement(
        comment
      );

    list.appendChild(
      element
    );

  });

}


// ============================================
// CREATE KOMENTAR KECIL
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
        ${escapeHTML(comment.sender)}
      </strong>

      <span>
        ${formatDate(comment.created_at)}
      </span>

    </div>


    <div class="comment-content">
      ${escapeHTML(comment.content)}
    </div>

  `;


  return div;
}


// ============================================
// SEND REPLY / COMMENT
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


  if (!contentInput) return;


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


  if (content.length > 500) {

    showNotice(
      "Komentar maksimal 500 karakter."
    );

    return;
  }


  /*
    Ambil data pesan induk
    menggunakan RPC.
  */

  const {
    data: parentData,
    error: parentError
  } = await db.rpc(
    "get_message_parent",
    {
      p_id: parentId
    }
  );


  const parent =
    parentData?.[0];


  if (
    parentError ||
    !parent
  ) {

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

    parent_id menunjuk ke
    pesan yang sedang dikomentari.
  */

  const {
    error
  } = await db
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


  /*
    Langsung refresh komentar
    tanpa refresh halaman.
  */

  await loadComments(
    parentId
  );

}


// ============================================
// NAMA ANGKATAN
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
// FORMAT TANGGAL
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
// REALTIME SUPABASE
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


    // ========================================
    // KOMENTAR BARU
    // ========================================

    if (
      newMessage.parent_id
    ) {

      const list =
        document.getElementById(
          `comments-list-${newMessage.parent_id}`
        );


      /*
        Kalau komentar sedang
        terbuka, langsung update.
      */

      if (list) {

        await loadComments(
          newMessage.parent_id
        );

      }

      return;
    }


    // ========================================
    // PESAN UTAMA BARU
    // ========================================

    if (
      currentSearchName &&
      String(
        newMessage.recipient
      ).toLowerCase() ===
      String(
        currentSearchName
      ).toLowerCase()
    ) {

      /*
        Tidak perlu refresh browser.
        Pencarian diambil ulang dari RPC.
      */

      await searchMessages();

    }

  }
)
.subscribe();


// ============================================
// ENTER = SEARCH
// ============================================

if (searchName) {

  searchName.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        searchMessages();

      }

    }
  );

}


// ============================================
// ENTER + CTRL = SEND
// ============================================

if (message) {

  message.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        event.ctrlKey
      ) {

        sendMessage();

      }

    }
  );

}