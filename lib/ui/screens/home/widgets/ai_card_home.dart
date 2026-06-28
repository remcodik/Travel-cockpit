import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../domain/models/trip.dart';

class AiCardHome extends StatelessWidget {
  final Trip trip;
  const AiCardHome({super.key, required this.trip});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/discover'),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primaryLight, Color(0xFFEFF7F2)],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1F1B4D35)),
          boxShadow: const [
            BoxShadow(color: Color(0x0A1B4D35), blurRadius: 8, offset: Offset(0,2)),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.fjordBlue],
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: const [
                  BoxShadow(color: Color(0x381B4D35), blurRadius: 10,
                      offset: Offset(0,4)),
                ],
              ),
              child: const Center(
                child: Text('\U0001f916', style: TextStyle(fontSize: 24)),
              ),
            ),
            const SizedBox(width: 13),
            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('AI idee\u00ebn voor vandaag',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800,
                          color: AppColors.primaryDark)),
                  const SizedBox(height: 3),
                  Text('Gebaseerd op 18\u00b0C, \${trip.name.split(' ').first} en jouw voorkeuren.',
                      style: const TextStyle(fontSize: 12,
                          color: AppColors.textSecond, height: 1.4)),
                  const SizedBox(height: 9),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text('\u2728  Bekijk idee\u00ebn',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800,
                            color: Colors.white)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
