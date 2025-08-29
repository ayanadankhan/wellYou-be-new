import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ITargetType {
    ALL_EMPLOYEES = 'All Employees',
    INDIVIDUALS = 'Individuals',
    DEPARTMENTS = 'Departments',
}

export enum IVisibilityType {
    PUBLIC = 'Public',
    PRIVATE = 'Private',
}

export const EVENT_CATEGORIES = ['Training', 'Celebration', 'Meeting', 'Awards', 'Other'] as const;
export type EventCategory = typeof EVENT_CATEGORIES[number];

export const EVENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Postponed'] as const;
export type EventStatus = typeof EVENT_STATUSES[number];

export const EVENT_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'PKR'] as const;
export type EventCurrency = typeof EVENT_CURRENCIES[number];

export const LOCATION_MODES = ['Onsite', 'Online'] as const;
export type LocationMode = typeof LOCATION_MODES[number];


@Schema({ _id: false })
export class Location {
    @Prop({ type: String, enum: LOCATION_MODES, required: true })
    mode: LocationMode;

    @Prop({ type: String, required: true })
    details: string;
}

@Schema({ _id: false })
export class Organizer {
    @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
    department: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User', required: true }] })
    selectedEmployees: Types.ObjectId[];
}

@Schema({ _id: false })
export class TargetAudience {
    @Prop({ type: String, enum: Object.values(ITargetType), required: true })
    type: ITargetType;

    @Prop({ type: String, enum: Object.values(IVisibilityType), required: true })
    visibility: IVisibilityType;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    individualIds: Types.ObjectId[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'departments' }], default: [] })
    departmentIds: Types.ObjectId[];
}

@Schema({ timestamps: true })
export class Event extends Document {
    @Prop({ type: String, required: true, trim: true })
    title: string;

    @Prop({ type: String, enum: EVENT_CATEGORIES, required: true })
    category: EventCategory;

    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date, required: true })
    endDate: Date;

    @Prop({ type: Location, required: true })
    location: Location;

    @Prop({ type: [Organizer], default: [] })
    organizers: Organizer[];

    @Prop({type: TargetAudience, required: false})
    targetAudience: TargetAudience;

    @Prop({ type: String, enum: EVENT_STATUSES, default: 'Scheduled' })
    status: EventStatus;

    @Prop({ type: Number, required: true })
    budget: number;

    @Prop({ type: String, enum: EVENT_CURRENCIES, default: 'USD' })
    currency: EventCurrency;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy?: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);
