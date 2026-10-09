import _ from "lodash";
import moment from "moment";
import numeral from "numeral";

moment.locale("id");

numeral.register("locale", "fr", {
  delimiters: {
    thousands: ".",
    decimal: ",",
  },
  abbreviations: {
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t",
  },
  ordinal: function (number) {
    return number === 1 ? "er" : "ème";
  },
  currency: {
    symbol: "€",
  },
});

numeral.locale("fr");

export const rupiah = (nominal: number) => {
  return numeral(nominal).format("0,0");
};

export const rubahtanggalunix = (unix: number) => {
  return moment.unix(unix).format("YYYY-MM-DD");
};

export const rubahtanggalunixbulantahun = (unix: number) => {
  return moment.unix(unix).format("DD MMMM YYYY");
};

export const rubahtanggalbulanunix = (unix: number) => {
  return moment.unix(unix).format("YYYY-MMM-DD");
};

export const rubahbulantahun = (unix: number) => {
  return moment.unix(unix).format("MMMM YYYY");
};

export const rubahtanggalunixjam = (unix: number) => {
  return moment.unix(unix).format("DD-MMM-YYYY HH:mm");
};

export const rubahtanggalunixjamdetik = (unix: number) => {
  return moment.unix(unix).format("DD-MMM-YYYY HH:mm:ss");
};

export const rubahtanggal = (date: string) => {
  return moment(date).locale("id").format("DD-MMMM-YYYY");
};

export const rubahtanggalpenawaran = (date: string) => {
  return moment(date).locale("id").format("DD MMMM YYYY");
};

export const rubahtanggallengkap = (date: string) => {
  return moment(date).format("DD MMMM YYYY");
};
export const rubahtanggalharilengkappettycash = (date: string) => {
  return moment(date).locale("id").format("DD MMMM YYYY");
};

export const rubahkejam = (unix: number) => {
  return moment.unix(unix).format("H:mm:ss");
};

export const tanggalunixskrg = () => {
  const tanggalsekarangmoment = moment().unix();
  return tanggalsekarangmoment;
};

export const jadirupiah = (nilai: number) => {
  // deklarasi variabel nilai sebagai angka matemarika
  // Objek Math bertujuan agar kita bisa melakukan tugas matemarika dengan javascript
  nilai = Math.floor(Math.abs(_.round(nilai)));

  // deklarasi nama angka dalam bahasa indonesia
  var huruf = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  // menyimpan nilai default untuk pembagian
  var bagi = 0;
  // deklarasi variabel penyimpanan untuk menyimpan proses rumus jadirupiah
  var penyimpanan = "";

  // rumus jadirupiah
  if (nilai < 12) {
    penyimpanan = " " + huruf[nilai];
  } else if (nilai < 20) {
    penyimpanan = jadirupiah(Math.floor(nilai - 10)) + " Belas";
  } else if (nilai < 100) {
    bagi = Math.floor(nilai / 10);
    penyimpanan = jadirupiah(bagi) + " Puluh" + jadirupiah(nilai % 10);
  } else if (nilai < 200) {
    penyimpanan = " Seratus" + jadirupiah(nilai - 100);
  } else if (nilai < 1000) {
    bagi = Math.floor(nilai / 100);
    penyimpanan = jadirupiah(bagi) + " Ratus" + jadirupiah(nilai % 100);
  } else if (nilai < 2000) {
    penyimpanan = " Seribu" + jadirupiah(nilai - 1000);
  } else if (nilai < 1000000) {
    bagi = Math.floor(nilai / 1000);
    penyimpanan = jadirupiah(bagi) + " Ribu" + jadirupiah(nilai % 1000);
  } else if (nilai < 1000000000) {
    bagi = Math.floor(nilai / 1000000);
    penyimpanan = jadirupiah(bagi) + " Juta" + jadirupiah(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    bagi = Math.floor(nilai / 1000000000);
    penyimpanan = jadirupiah(bagi) + " Miliar" + jadirupiah(nilai % 1000000000);
  } else if (nilai < 1000000000000000) {
    bagi = Math.floor(nilai / 1000000000000);
    penyimpanan =
      jadirupiah(nilai / 1000000000000) +
      " Triliun" +
      jadirupiah(nilai % 1000000000000);
  }

  // mengambalikan nilai yang ada dalam variabel penyimpanan
  return penyimpanan;
};

export const terbilang = (nilai: number) => {
  if (!nilai || nilai <= 0) return "";
  return jadirupiah(nilai).replace(/\s+/g, " ").trim() + " Rupiah";
};
