import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import {
  AppointmentStatus,
  BarberMembershipStatus,
  KycStatus,
  TimeSlotStatus,
  UserRole,
} from "../src/generated/prisma/enums";
import { PasswordService } from "../src/auth/password.service";

type ShopSeed = {
  key: string;
  name: string;
  locality: string;
  postalCode: string;
  addressLine1: string;
  description: string;
};

type ServiceSeed = {
  name: string;
  description: string;
  durationMin: number;
  price: number;
};

const shops: ShopSeed[] = [
  {
    key: "miyapur-metro-edge",
    name: "Metro Edge Barbers",
    locality: "Miyapur",
    postalCode: "500049",
    addressLine1: "Miyapur X Roads",
    description:
      "A neighbourhood grooming studio for clean cuts, beard styling, and quick weekday appointments.",
  },
  {
    key: "miyapur-northline",
    name: "Northline Grooming Studio",
    locality: "Miyapur",
    postalCode: "500049",
    addressLine1: "Miyapur-Bollaram Road",
    description:
      "A relaxed local studio offering family haircuts, beard care, and restorative grooming services.",
  },
  {
    key: "miyapur-urban-comb",
    name: "Urban Comb Miyapur",
    locality: "Miyapur",
    postalCode: "500049",
    addressLine1: "Madinaguda Road",
    description:
      "Contemporary styling and dependable everyday grooming for residents around Miyapur.",
  },
  {
    key: "hitec-cyber-trim",
    name: "Cyber Trim Studio",
    locality: "HITEC City",
    postalCode: "500081",
    addressLine1: "HITEC City Main Road",
    description:
      "Modern hair and beard services for professionals working around Hyderabad's technology corridor.",
  },
  {
    key: "hitec-tech-park",
    name: "Tech Park Grooming Co.",
    locality: "HITEC City",
    postalCode: "500081",
    addressLine1: "Mindspace Road",
    description:
      "Appointment-friendly cuts, styling, and beard services created for the working week.",
  },
  {
    key: "hitec-pixel-blade",
    name: "Pixel & Blade",
    locality: "HITEC City",
    postalCode: "500081",
    addressLine1: "Durgam Cheruvu Road",
    description:
      "Trend-aware barbers providing precision fades, textured styles, and detailed beard work.",
  },
  {
    key: "hafeezpet-groom-room",
    name: "The Groom Room",
    locality: "Hafeezpet",
    postalCode: "500049",
    addressLine1: "Hafeezpet Main Road",
    description:
      "Friendly local barbers offering classic haircuts, beard care, and family grooming services.",
  },
  {
    key: "hafeezpet-station-side",
    name: "Station Side Barbers",
    locality: "Hafeezpet",
    postalCode: "500049",
    addressLine1: "Hafeezpet Station Road",
    description:
      "Quick, practical grooming with specialists for classic cuts, beard shaping, and kids' styles.",
  },
  {
    key: "hafeezpet-westside",
    name: "Westside Cut House",
    locality: "Hafeezpet",
    postalCode: "500049",
    addressLine1: "Old Mumbai Highway",
    description:
      "A community barbershop balancing classic techniques with modern hair and beard styling.",
  },
  {
    key: "gachibowli-grooming-club",
    name: "Gachibowli Grooming Club",
    locality: "Gachibowli",
    postalCode: "500032",
    addressLine1: "Gachibowli Main Road",
    description:
      "Contemporary cuts, beard detailing, and relaxing grooming packages in west Hyderabad.",
  },
  {
    key: "gachibowli-stadium",
    name: "Stadium Barber Co.",
    locality: "Gachibowli",
    postalCode: "500032",
    addressLine1: "Stadium Road",
    description:
      "Fresh cuts, scalp care, and beard detailing from a team with varied grooming specialties.",
  },
  {
    key: "gachibowli-telecom",
    name: "Telecom Nagar Trim Studio",
    locality: "Gachibowli",
    postalCode: "500032",
    addressLine1: "Telecom Nagar Road",
    description:
      "Personalised consultations, office-ready styles, and relaxed weekend grooming appointments.",
  },
  {
    key: "financial-district-cut-house",
    name: "District Cut House",
    locality: "Financial District",
    postalCode: "500032",
    addressLine1: "Financial District Main Road",
    description:
      "Premium express grooming with appointment-friendly services for busy professionals.",
  },
  {
    key: "financial-nanakramguda",
    name: "Nanakramguda Groom Lab",
    locality: "Financial District",
    postalCode: "500032",
    addressLine1: "Nanakramguda Road",
    description:
      "A modern grooming lab focused on detailed consultations, precision work, and consistent results.",
  },
  {
    key: "financial-skyline",
    name: "Skyline Barber Lounge",
    locality: "Financial District",
    postalCode: "500032",
    addressLine1: "ISB Road",
    description:
      "An elevated but approachable lounge for detailed styling, colour, beard care, and relaxation.",
  },
];

const previousShopKeys = [
  "miyapur",
  "hitec-city",
  "hafeezpet",
  "financial-district",
  "gachibowli",
  "kondapur",
  "madhapur",
  "kukatpally",
  "manikonda",
  "nallagandla",
  "chanda-nagar",
  "jubilee-hills",
  "banjara-hills",
  "kokapet",
  "narsingi",
];

const ownerNames = [
  { firstName: "Rohan", lastName: "Mehta" },
  { firstName: "Suresh", lastName: "Reddy" },
  { firstName: "Aamir", lastName: "Khan" },
  { firstName: "Vikram", lastName: "Rao" },
  { firstName: "Arjun", lastName: "Patel" },
  { firstName: "Naveen", lastName: "Sharma" },
  { firstName: "Sameer", lastName: "Ali" },
  { firstName: "Karthik", lastName: "Naik" },
  { firstName: "Rahul", lastName: "Verma" },
  { firstName: "Farhan", lastName: "Khan" },
  { firstName: "Deepak", lastName: "Yadav" },
  { firstName: "Manoj", lastName: "Gupta" },
  { firstName: "Pavan", lastName: "Kumar" },
  { firstName: "Aditya", lastName: "Shah" },
  { firstName: "Sanjay", lastName: "Singh" },
];

const serviceCatalog: ServiceSeed[] = [
  {
    name: "Classic Haircut",
    description: "Consultation, precision haircut, and finishing style.",
    durationMin: 30,
    price: 349,
  },
  {
    name: "Beard Trim & Shape",
    description: "Beard trimming, line-up, and shape detailing.",
    durationMin: 20,
    price: 249,
  },
  {
    name: "Haircut & Beard Combo",
    description: "A complete haircut and beard grooming session.",
    durationMin: 50,
    price: 549,
  },
  {
    name: "Kids Haircut",
    description: "A comfortable haircut service for children.",
    durationMin: 25,
    price: 299,
  },
  {
    name: "Hair Wash & Styling",
    description: "Cleansing hair wash followed by professional styling.",
    durationMin: 30,
    price: 399,
  },
  {
    name: "Head Massage",
    description: "A relaxing oil head massage to help release tension.",
    durationMin: 25,
    price: 449,
  },
  {
    name: "Hair Colour",
    description: "Consultation and application of a natural-looking hair colour.",
    durationMin: 75,
    price: 999,
  },
  {
    name: "Facial & Cleanup",
    description: "Face cleanse, exfoliation, massage, and finishing care.",
    durationMin: 45,
    price: 799,
  },
];

const barberSpecialties = [
  "Classic scissor cuts and clean, office-ready styling.",
  "Skin fades, tapers, and modern textured hairstyles.",
  "Beard shaping, line-ups, and traditional beard care.",
  "Kids' haircuts and comfortable first-time appointments.",
  "Hair colour consultation, grey blending, and colour maintenance.",
  "Long-hair shaping, layered cuts, and blow-dry styling.",
  "Scalp care, hair wash treatments, and relaxing head massage.",
  "Facial cleanup, skin preparation, and special-event grooming.",
];

const ratingPatterns = [
  [5, 5, 5, 4, 5],
  [4, 5, 4, 4],
  [5, 4, 5],
  [5, 5, 4, 5, 5, 4],
  [4, 4, 5, 4],
  [5, 5, 5],
  [4, 3, 5, 4],
  [5, 4, 5, 4, 5],
  [4, 4, 4],
  [5, 5, 4, 4, 5],
  [3, 4, 4, 5],
  [5, 5, 5, 4],
  [4, 5, 4],
  [5, 4, 5, 5],
  [4, 4, 5, 5, 4],
];

const reviewComments = [
  "Great consultation and a very clean haircut.",
  "The barber understood the style I wanted and finished on time.",
  "Friendly team, tidy shop, and careful beard work.",
  "Easy appointment and a comfortable grooming experience.",
  "Good service and clear pricing. I would visit again.",
  "The fade and finishing were both done really well.",
];

const firstNames = [
  "Aarav",
  "Aditya",
  "Akash",
  "Arjun",
  "Danish",
  "Deepak",
  "Farhan",
  "Imran",
  "Karthik",
  "Manoj",
  "Naveen",
  "Pavan",
  "Rahul",
  "Rakesh",
  "Rohit",
  "Sameer",
  "Sandeep",
  "Sanjay",
  "Suraj",
  "Varun",
];

const lastNames = [
  "Ali",
  "Babu",
  "Das",
  "Gupta",
  "Khan",
  "Kumar",
  "Naik",
  "Patel",
  "Rao",
  "Reddy",
  "Shah",
  "Sharma",
  "Singh",
  "Verma",
  "Yadav",
];

function deterministicUuid(key: string) {
  const hash = createHash("sha256")
    .update(`trimly-development-seed:${key}`)
    .digest("hex");
  const variant = ((Number.parseInt(hash[16], 16) & 0x3) | 0x8).toString(16);

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${variant}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function barberName(shopIndex: number, barberIndex: number) {
  const index = (shopIndex * 8 + barberIndex) * 37;
  const combinationCount = firstNames.length * lastNames.length;
  const combination = index % combinationCount;

  return `${firstNames[combination % firstNames.length]} ${
    lastNames[Math.floor(combination / firstNames.length)]
  }`;
}

function startOfTodayInHyderabad() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00+05:30`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database");
  }

  const ownerPassword = process.env.SEED_OWNER_PASSWORD?.trim();
  if (!ownerPassword || ownerPassword.length < 12) {
    throw new Error(
      "SEED_OWNER_PASSWORD with at least 12 characters is required to seed owner accounts",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await new PasswordService().hash(ownerPassword);

    const customerProfileIds: string[] = [];
    for (let customerIndex = 0; customerIndex < 6; customerIndex += 1) {
      const userId = deterministicUuid(`review-customer-user:${customerIndex}`);
      const profileId = deterministicUuid(
        `review-customer-profile:${customerIndex}`,
      );
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          email: `review-customer-${customerIndex + 1}@trimly.example`,
          roles: [UserRole.CUSTOMER],
        },
        create: {
          id: userId,
          email: `review-customer-${customerIndex + 1}@trimly.example`,
          roles: [UserRole.CUSTOMER],
        },
      });
      await prisma.customerProfile.upsert({
        where: { userId },
        update: {
          firstName: `Demo Customer ${customerIndex + 1}`,
          lastName: null,
        },
        create: {
          id: profileId,
          userId,
          firstName: `Demo Customer ${customerIndex + 1}`,
        },
      });
      customerProfileIds.push(profileId);
    }

    const knownShopKeys = [
      ...new Set([...previousShopKeys, ...shops.map((shop) => shop.key)]),
    ];
    const knownShopIds = knownShopKeys.map((key) =>
      deterministicUuid(`shop:${key}`),
    );
    const knownBarberIds = knownShopKeys.flatMap((key) =>
      Array.from({ length: 8 }, (_, index) =>
        deterministicUuid(`barber:${key}:${index}`),
      ),
    );
    const knownOwnerUserIds = [
      deterministicUuid("owner-user"),
      ...knownShopKeys.map((key) => deterministicUuid(`owner-user:${key}`)),
    ];
    const knownAppointmentIds = knownShopKeys.flatMap((key) =>
      Array.from({ length: 6 }, (_, index) =>
        deterministicUuid(`review-appointment:${key}:${index}`),
      ),
    );

    // Remove only records created by this development seed. This replaces old
    // seed revisions without touching shops or barbers created through the API.
    await prisma.review.deleteMany({
      where: { appointmentId: { in: knownAppointmentIds } },
    });
    await prisma.appointment.deleteMany({
      where: { id: { in: knownAppointmentIds } },
    });
    await prisma.shopBarberMembership.deleteMany({
      where: {
        OR: [
          { shopId: { in: knownShopIds } },
          { barberId: { in: knownBarberIds } },
        ],
      },
    });
    await prisma.service.deleteMany({
      where: { shopId: { in: knownShopIds } },
    });
    await prisma.shop.deleteMany({ where: { id: { in: knownShopIds } } });
    await prisma.user.deleteMany({
      where: { id: { in: knownOwnerUserIds } },
    });
    await prisma.barber.deleteMany({
      where: { id: { in: knownBarberIds } },
    });

    let barberTotal = 0;
    let serviceTotal = 0;
    const timeSlots: Prisma.TimeSlotCreateManyInput[] = [];
    const appointments: Prisma.AppointmentCreateManyInput[] = [];
    const reviews: Prisma.ReviewCreateManyInput[] = [];
    const availabilityStart = startOfTodayInHyderabad();

    for (const [shopIndex, shopSeed] of shops.entries()) {
      const shopId = deterministicUuid(`shop:${shopSeed.key}`);
      const ownerUserId = deterministicUuid(`owner-user:${shopSeed.key}`);
      const ownerProfileId = deterministicUuid(
        `owner-profile:${shopSeed.key}`,
      );
      const ownerName = ownerNames[shopIndex];
      const barberCount = 5 + (shopIndex % 4);
      const serviceCount = 5 + (shopIndex % 4);

      await prisma.user.create({
        data: {
          id: ownerUserId,
          email: `owner.${shopSeed.key}@trimly.example`,
          roles: [UserRole.SHOP_OWNER],
          roleCredentials: {
            create: {
              id: deterministicUuid(`owner-credential:${shopSeed.key}`),
              role: UserRole.SHOP_OWNER,
              passwordHash,
            },
          },
          ownerProfile: {
            create: {
              id: ownerProfileId,
              firstName: ownerName.firstName,
              lastName: ownerName.lastName,
              businessLegalName: `${shopSeed.name} Development`,
              kycStatus: KycStatus.VERIFIED,
            },
          },
        },
      });

      await prisma.shop.upsert({
        where: { id: shopId },
        update: {
          ownerId: ownerProfileId,
          name: shopSeed.name,
          description: shopSeed.description,
          email: `${shopSeed.key}@shops.trimly.example`,
          addressLine1: shopSeed.addressLine1,
          addressLine2: null,
          locality: shopSeed.locality,
          city: "Hyderabad",
          state: "Telangana",
          postalCode: shopSeed.postalCode,
          country: "India",
        },
        create: {
          id: shopId,
          ownerId: ownerProfileId,
          name: shopSeed.name,
          description: shopSeed.description,
          email: `${shopSeed.key}@shops.trimly.example`,
          addressLine1: shopSeed.addressLine1,
          locality: shopSeed.locality,
          city: "Hyderabad",
          state: "Telangana",
          postalCode: shopSeed.postalCode,
          country: "India",
        },
      });

      for (let serviceIndex = 0; serviceIndex < serviceCount; serviceIndex += 1) {
        const serviceSeed = serviceCatalog[serviceIndex];
        const serviceId = deterministicUuid(
          `service:${shopSeed.key}:${serviceSeed.name}`,
        );
        const areaPriceAdjustment = (shopIndex % 5) * 25;

        await prisma.service.upsert({
          where: { id: serviceId },
          update: {
            shopId,
            name: serviceSeed.name,
            description: serviceSeed.description,
            durationMin: serviceSeed.durationMin,
            price: serviceSeed.price + areaPriceAdjustment,
            isActive: true,
          },
          create: {
            id: serviceId,
            shopId,
            name: serviceSeed.name,
            description: serviceSeed.description,
            durationMin: serviceSeed.durationMin,
            price: serviceSeed.price + areaPriceAdjustment,
            isActive: true,
          },
        });
      }

      for (let barberIndex = 0; barberIndex < barberCount; barberIndex += 1) {
        const barberId = deterministicUuid(
          `barber:${shopSeed.key}:${barberIndex}`,
        );
        const membershipId = deterministicUuid(
          `membership:${shopSeed.key}:${barberIndex}`,
        );
        const displayName = barberName(shopIndex, barberIndex);
        const specialty =
          barberSpecialties[
            (shopIndex * 3 + barberIndex) % barberSpecialties.length
          ];

        await prisma.barber.upsert({
          where: { id: barberId },
          update: {
            displayName,
            bio: `Specialises in ${specialty}`,
            isManaged: true,
            isDiscoverable: true,
          },
          create: {
            id: barberId,
            displayName,
            bio: `Specialises in ${specialty}`,
            isManaged: true,
            isDiscoverable: true,
          },
        });

        await prisma.shopBarberMembership.upsert({
          where: { id: membershipId },
          update: {
            shopId,
            barberId,
            invitedByOwnerId: ownerProfileId,
            status: BarberMembershipStatus.ACTIVE,
            respondedAt: new Date(),
          },
          create: {
            id: membershipId,
            shopId,
            barberId,
            invitedByOwnerId: ownerProfileId,
            status: BarberMembershipStatus.ACTIVE,
            respondedAt: new Date(),
          },
        });

        for (let day = 0; day < 14; day += 1) {
          for (const hour of [10, 16]) {
            const startsAt = new Date(
              availabilityStart.getTime() +
                day * 24 * 60 * 60 * 1_000 +
                hour * 60 * 60 * 1_000,
            );
            timeSlots.push({
              id: deterministicUuid(
                `availability:${shopSeed.key}:${barberIndex}:${day}:${hour}`,
              ),
              barberId,
              startsAt,
              endsAt: new Date(startsAt.getTime() + 90 * 60 * 1_000),
              status: TimeSlotStatus.AVAILABLE,
            });
          }
        }
      }

      for (const [reviewIndex, rating] of ratingPatterns[shopIndex].entries()) {
        const barberIndex = reviewIndex % barberCount;
        const serviceIndex = reviewIndex % serviceCount;
        const barberId = deterministicUuid(
          `barber:${shopSeed.key}:${barberIndex}`,
        );
        const serviceId = deterministicUuid(
          `service:${shopSeed.key}:${serviceCatalog[serviceIndex].name}`,
        );
        const timeSlotId = deterministicUuid(
          `review-slot:${shopSeed.key}:${reviewIndex}`,
        );
        const appointmentId = deterministicUuid(
          `review-appointment:${shopSeed.key}:${reviewIndex}`,
        );
        const startsAt = new Date(
          availabilityStart.getTime() -
            (30 + shopIndex * 5 + reviewIndex) * 24 * 60 * 60 * 1_000 +
            12 * 60 * 60 * 1_000,
        );
        const customerId =
          customerProfileIds[reviewIndex % customerProfileIds.length];

        timeSlots.push({
          id: timeSlotId,
          barberId,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 60 * 60 * 1_000),
          status: TimeSlotStatus.BOOKED,
        });
        appointments.push({
          id: appointmentId,
          customerId,
          shopId,
          barberId,
          serviceId,
          timeSlotId,
          status: AppointmentStatus.COMPLETED,
        });
        reviews.push({
          id: deterministicUuid(`review:${shopSeed.key}:${reviewIndex}`),
          customerId,
          shopId,
          barberId,
          appointmentId,
          rating,
          comment: reviewComments[(shopIndex + reviewIndex) % reviewComments.length],
        });
      }

      barberTotal += barberCount;
      serviceTotal += serviceCount;
    }

    for (let offset = 0; offset < timeSlots.length; offset += 500) {
      await prisma.timeSlot.createMany({
        data: timeSlots.slice(offset, offset + 500),
      });
    }
    await prisma.appointment.createMany({ data: appointments });
    await prisma.review.createMany({ data: reviews });

    console.log(
      `Seeded ${shops.length} shops, ${barberTotal} barbers, ${serviceTotal} services, ${reviews.length} reviews, and ${timeSlots.length} time slots.`,
    );
    console.log(
      "Each shop has a separate owner account using the configured SEED_OWNER_PASSWORD.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Database seed failed:", error);
  process.exitCode = 1;
});
