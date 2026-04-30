export interface VlessKey {
  id: number | string;
  name: string;
  location: string;
  protocol: string;
  latency: string;
  config: string;
  load: number;
  expiryDate: string;
  status?: 'online' | 'unstable' | 'offline';
  reason?: string;
  isSpecial?: boolean;
  subKeys?: { name: string; config: string; location: string }[];
  showMiniBanner?: boolean;
}

export const MOCK_KEYS: VlessKey[] = [
  {
    id: 1,
    name: "Server #1",
    location: "Нидерланды, Амстердам",
    protocol: "VLESS / REALITY",
    latency: "42ms",
    load: 18,
    expiryDate: "02.05.2026",
    status: "online",
    config: "vless://37c06ef4-4884-4eb4-964d-64ef07f7e4c2@nl-ams-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=pSaBLgVfLqmeYgUOxvN1K9i55ChIDk4_i5MLQrOfVGU&security=reality&sid=714c1a42&sni=nl-ams-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%B3%F0%9F%87%B1%20%D0%9D%D0%B8%D0%B4%D0%B5%D1%80%D0%BB%D0%B0%D0%BD%D0%B4%D1%8B%202"
  },
  {
    id: 2,
    name: "Server #2",
    location: "Германия, Франкфурт-На-Майне",
    protocol: "VLESS / REALITY",
    latency: "38ms",
    load: 22,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://c3c961ae-49b4-424a-b27a-3db9cab3fab1@de-fra-7.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=JX7Jypvu8v-gBMfv3wFihZWS3GleDH7wD4Ko-w7urC8&security=reality&sid=17ab5266&sni=de-fra-7.blook.network&spx=%2F&type=tcp#%F0%9F%87%A9%F0%9F%87%AA%20%D0%93%D0%B5%D1%80%D0%BC%D0%B0%D0%BD%D0%B8%D1%8F%207"
  },
  {
    id: 3,
    name: "Server #3",
    location: "Финляндия, Хельсинки",
    protocol: "VLESS / REALITY",
    latency: "45ms",
    load: 15,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://a9c121f5-04b7-405a-bf86-cf914927bd24@fi-hel-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=My4NYF1x_I4nnRhgQXjpKl6BQVtgBWklHP6a3ejmOxU&security=reality&sid=1a66e6ad&sni=fi-hel-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%AB%F0%9F%87%AE%20%D0%A4%D0%B8%D0%BD%D0%BB%D1%8F%D0%BD%D0%B4%D0%B8%D1%8F%201"
  },
  {
    id: 4,
    name: "Server #4",
    location: "США, Нью-Йорк",
    protocol: "VLESS / REALITY",
    latency: "115ms",
    load: 12,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://b759be65-9c45-473f-acae-53a7302b5bb0@us-jfk-3.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=FamtkEIjPM1tSvRTsWlgOXjlvvCG6mkwckMjUw0y7B4&security=reality&sid=42437183&sni=us-jfk-3.blook.network&spx=%2F&type=tcp#%F0%9F%87%BA%F0%9F%87%B8%20%D0%A1%D0%A8%D0%90%203"
  },
  {
    id: 5,
    name: "Server #5",
    location: "Великобритания, Лондон",
    protocol: "VLESS / REALITY",
    latency: "48ms",
    load: 25,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://e4e157b9-7227-47cb-a368-00801b8be8e4@uk-lhr-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=p0MkIIxkklgPs4vJJP5Qp9RxdqgMnjmgoIt5t8g6uSU&security=reality&sid=794dbecd&sni=uk-lhr-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%AC%F0%9F%87%A7%20%D0%92%D0%B5%D0%BB%D0%B8%D0%BA%D0%BE%D0%B1%D1%80%D0%B8%D1%82%D0%B0%D0%BD%D0%B8%D1%8F%202"
  },
  {
    id: 6,
    name: "Server #6",
    location: "Молдова, Кишинёв",
    protocol: "VLESS / REALITY",
    latency: "55ms",
    load: 10,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://cafd53a0-e202-4cb8-8d66-ed794acf1f56@md-kiv-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=SqYAVrG01Mk0KXzlkmckO6lxvv6iZBJJvxE6PvD2vD0&security=reality&sid=3c2f8f52&sni=md-kiv-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%B2%F0%9F%87%A9%20%D0%90%D0%BA%D1%82%D0%B8%D0%B2%D0%BD%D1%8B%D0%B9%201"
  },
  {
    id: 7,
    name: "Server #7",
    location: "Индия, Бангалор",
    protocol: "VLESS / REALITY",
    latency: "145ms",
    load: 8,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://1ba84736-e233-4598-8b75-8fae3bf9fc2d@in-blr-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=4hgbGo2EFMD_G-67IL4UrPtBri0Dh-l_SFafynnVHm8&security=reality&sid=dd0d7f6b&sni=in-blr-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%AE%F0%9F%87%B3%20%D0%98%D0%BD%D0%B4%D0%B8%D1%8F%202"
  },
  {
    id: 8,
    name: "Server #8",
    location: "Казахстан, Алматы",
    protocol: "VLESS / REALITY",
    latency: "75ms",
    load: 14,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://c288faa5-8819-47fd-947a-cda36dcf1815@kz-ala-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=cEKfInbAE2ZWB3RH-MYQiIfA2aAPO6wZT_TNCPgh7TE&security=reality&sid=85b45f16&sni=kz-ala-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%B0%F0%9F%87%BF%20%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%201"
  },
  {
    id: 9,
    name: "Server #9",
    location: "Россия, Москва",
    protocol: "VLESS / REALITY",
    latency: "25ms",
    load: 45,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://dddfb1b2-6c8d-46f7-b0a3-4fc9fa5650ca@ru-svo-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=A1KLk_6e6jCWZDDWuuzojzSPxQELc2jqK1hHU3ooG34&security=reality&sid=874db238&sni=ru-svo-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%B7%F0%9F%87%BA%20%D0%A0%D0%BE%D1%81%D1%81%D0%B8%D1%8F%202"
  },
  {
    id: 10,
    name: "Server #10",
    location: "Швеция, Стокгольм",
    protocol: "VLESS / REALITY",
    latency: "52ms",
    load: 18,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://a2e8c461-9c79-4dc0-8581-bab2c7b54eb8@se-arn-3.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=7SoBLgSMueqCkQCm6c2CeJFWrS9OSYE4Wx1-77zA1h0&security=reality&sid=78c5fac2&sni=se-arn-3.blook.network&spx=%2F&type=tcp#%F0%9F%87%B8%F0%9F%87%AA%20%D0%A8%D0%B2%D0%B5%D1%86%D0%B8%D1%8F%203"
  },
  {
    id: 11,
    name: "Server #11",
    location: "Турция, Стамбул",
    protocol: "VLESS / REALITY",
    latency: "65ms",
    load: 30,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://e4c8e300-dee6-47f8-96ec-b4e443a7a17e@tr-ist-8.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=ZjjejWQ2z6v8yinwngZMjgh2rozcTfBgXC930RUDE1I&security=reality&sid=7ccfb185&sni=tr-ist-8.blook.network&spx=%2F&type=tcp#%F0%9F%87%B9%F0%9F%87%B7%20%D0%A2%D1%83%D1%80%D1%86%D0%B8%D1%8F%208"
  },
  {
    id: 12,
    name: "Server #12",
    location: "Япония, Токио",
    protocol: "VLESS / REALITY",
    latency: "210ms",
    load: 5,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://c1586df9-5aa4-43fb-8fbe-73eec60476af@jp-nrt-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=K64BDKK1ZIZis2nnBKhkhT-0Lo7iszkU9An2ydlIXQM&security=reality&sid=990dd674&sni=jp-nrt-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%AF%F0%9F%87%B5%20%D0%AF%D0%BF%D0%BE%D0%BD%D0%B8%D1%8F%201"
  },
  {
    id: 13,
    name: "Server #13",
    location: "Бразилия, Сан-Паулу",
    protocol: "VLESS / REALITY",
    latency: "240ms",
    load: 4,
    expiryDate: "27.04.2026",
    status: "online",
    config: "vless://75b2cde7-3357-4c44-b744-273288313c5f@br-gru-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=GYqQl8suX6lgrJZ27CkhMwtxmDGkd45QxKBJGaHUgQM&security=reality&sid=7cc366b3&sni=br-gru-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%A7%F0%9F%87%B7%20%D0%91%D1%80%D0%B0%D0%B7%D0%B8%D0%BB%D0%B8%D1%8F%201"
  }
];
