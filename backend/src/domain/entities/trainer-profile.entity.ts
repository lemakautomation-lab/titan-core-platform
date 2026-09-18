import { randomUUID } from "crypto";

export class TrainerProfile {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly userId: string,
        public professionalTitle: string | null,
        public bio: string | null,
        public qualifications: string | null,
        public specialisations: string | null,
        public yearsExperience: number | null,
        public countryCode: string | null,
        public websiteUrl: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) {}

    static create(
        tenantId: string,
        userId: string,
        professionalTitle: string | null,
        bio: string | null,
        qualifications: string | null,
        specialisations: string | null,
        yearsExperience: number | null,
        countryCode: string | null,
        websiteUrl: string | null,
        now: Date = new Date(),
    ): TrainerProfile {

        const profile = new TrainerProfile(
            randomUUID(),
            tenantId,
            userId,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            now,
            now,
        );

        profile.update(
            professionalTitle,
            bio,
            qualifications,
            specialisations,
            yearsExperience,
            countryCode,
            websiteUrl,
            now,
        );

        return profile;
    }

    update(
        professionalTitle: string | null,
        bio: string | null,
        qualifications: string | null,
        specialisations: string | null,
        yearsExperience: number | null,
        countryCode: string | null,
        websiteUrl: string | null,
        now: Date = new Date(),
    ): void {

        if (
            yearsExperience !== null &&
            (
                !Number.isInteger(yearsExperience) ||
                yearsExperience < 0 ||
                yearsExperience > 100
            )
        ) {
            throw new Error(
                "Years of experience is invalid.",
            );
        }

        this.professionalTitle =
            TrainerProfile.clean(professionalTitle, 120);

        this.bio =
            TrainerProfile.clean(bio, 2000);

        this.qualifications =
            TrainerProfile.clean(qualifications, 2000);

        this.specialisations =
            TrainerProfile.clean(specialisations, 1000);

        this.countryCode =
            TrainerProfile.clean(countryCode, 2);

        if (
            this.countryCode !== null &&
            !/^[A-Z]{2}$/.test(this.countryCode.toUpperCase())
        ) {
            throw new Error(
                "Country code is invalid.",
            );
        }

        if (this.countryCode !== null) {
            this.countryCode =
                this.countryCode.toUpperCase();
        }

        this.websiteUrl =
            TrainerProfile.clean(websiteUrl, 500);

        if (this.websiteUrl !== null) {
            let parsed: URL;

            try {
                parsed = new URL(this.websiteUrl);
            }
            catch {
                throw new Error(
                    "Website URL is invalid.",
                );
            }

            if (
                parsed.protocol !== "https:" &&
                parsed.protocol !== "http:"
            ) {
                throw new Error(
                    "Website URL is invalid.",
                );
            }
        }

        this.yearsExperience = yearsExperience;
        this.updatedAt = new Date(now);
    }

    private static clean(
        value: string | null,
        maxLength: number,
    ): string | null {

        if (value === null) {
            return null;
        }

        const cleaned = value.trim();

        if (cleaned.length === 0) {
            return null;
        }

        if (cleaned.length > maxLength) {
            throw new Error(
                "Trainer profile field exceeds maximum length.",
            );
        }

        return cleaned;
    }

}
