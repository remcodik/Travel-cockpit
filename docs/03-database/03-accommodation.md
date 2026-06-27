# Accommodation

**Document ID:** TC-DB-003  
**Version:** 0.1  
**Status:** Stable

## Purpose

Accommodation is a specialised Place where the traveller stays during a Trip.

Accommodation does not introduce a separate location model. It extends the generic Place entity with travel-specific information.

## Additional Attributes

In addition to the standard Place attributes, an Accommodation may contain:

- Check-in date
- Check-out date
- Booking reference
- Host
- Contact details
- Room or unit
- Price (optional)
- Personal rating
- Notes

## Relationships

An Accommodation:

- Is a Place
- Belongs to one Trip
- Can be the Active Accommodation
- Can contain multiple planned Activities
- Acts as the operational centre during a stay

## Business Rules

- A Trip may contain multiple Accommodations.
- Only one Accommodation can be Active at any time.
- AI recommendations use the Active Accommodation as the primary reference point.

## Guiding Principle

> Every Accommodation is a Place, but not every Place is an Accommodation.
